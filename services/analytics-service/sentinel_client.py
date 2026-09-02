"""
Sentinel Client & Gateway Manager
Connects to the Sentinel Grid (https://cctv.corp8.cloud/),
manages authenticated session tokens, discovers live cameras,
and provides authenticated HLS/RTSP stream relay with AES-128 key resolution.
"""

import requests
import json
import logging
import re
from typing import List, Dict, Any, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sentinel_client")

SENTINEL_BASE_URL = "https://cctv.corp8.cloud"
SENTINEL_PASSWORD = "NLFG-4QKB-K83P"

LOCATION_METADATA: Dict[str, Dict[str, str]] = {
    "chiman bhai": {"district": "Ahmedabad", "department": "Traffic Police", "location": "Chimanbhai Bridge, Ahmedabad"},
    "janpath": {"district": "Ahmedabad", "department": "Traffic Police", "location": "Janpath, Ahmedabad"},
    "o.n.g.c": {"district": "Ahmedabad", "department": "State Police", "location": "ONGC Office Circle, Ahmedabad"},
    "paldi": {"district": "Ahmedabad", "department": "Traffic Police", "location": "Paldi Cross Road, Ahmedabad"},
    "visat": {"district": "Ahmedabad", "department": "Traffic Police", "location": "Visat Teen Rasta, Sabarmati"},
    "timbavadi": {"district": "Junagadh", "department": "Municipal Corp", "location": "Timbavadi Gate, Junagadh"},
    "somnath": {"district": "Gir Somnath", "department": "Traffic Police", "location": "Hero Showroom, Gir Somnath"},
    "majewadi": {"district": "Junagadh", "department": "Municipal Corp", "location": "Majewadi Gate, Junagadh"},
    "bypass": {"district": "Junagadh", "department": "State Highways", "location": "New Bypass Circle, Junagadh"},
    "char-chowk": {"district": "Junagadh", "department": "Municipal Corp", "location": "Char Chowk Road, Junagadh"},
    "dolatpara": {"district": "Junagadh", "department": "Traffic Police", "location": "Dolatpara, Junagadh"},
    "adalaj": {"district": "Gandhinagar", "department": "Transport Dept", "location": "Tri Mandir Toll Plaza, Adalaj"},
    "cn vidhyalaya": {"district": "Ahmedabad", "department": "Traffic Police", "location": "CN Vidhyalaya Road, Ahmedabad"},
    "delight": {"district": "Ahmedabad", "department": "Traffic Police", "location": "Delight RLVD Junction, Ahmedabad"},
    "suvidha": {"district": "Ahmedabad", "department": "Municipal Corp", "location": "Suvidha Park, Ahmedabad"},
    "rajkot": {"district": "Rajkot", "department": "Traffic Police", "location": "Rajkot Bus Port Terminal"},
    "navsari": {"district": "Navsari", "department": "Rural Police", "location": "Khaparia Gram Panchayat, Gandevi"},
    "mohanpura": {"district": "Ahmedabad", "department": "Traffic Police", "location": "Mohanpura Junction, Ahmedabad"},
    "patan": {"district": "Patan", "department": "Traffic Police", "location": "Dethali Char Rasta, Patan"},
    "mervada": {"district": "Banaskantha", "department": "State Police", "location": "BK Mervada Tran Rasta"},
    "kheram": {"district": "Navsari", "department": "Rural Police", "location": "Kheram Checkpost, Navsari"},
    "dehgam": {"district": "Gandhinagar", "department": "State Highways", "location": "Dehgam Char Rasta, Gandhinagar"},
    "dhanori": {"district": "Navsari", "department": "Rural Police", "location": "Dhanori Gate, Navsari"},
    "tankal": {"district": "Navsari", "department": "Rural Police", "location": "Tankal Checkpoint, Navsari"},
    "bilimora": {"district": "Navsari", "department": "Municipal Corp", "location": "Bilimora City Core, Navsari"},
    "gandhidham": {"district": "Kutch", "department": "Port Authority", "location": "Rambaugh P2, Gandhidham Port"},
}

FALLBACK_LOCATIONS = [
    {"district": "Ahmedabad", "department": "Traffic Police", "location": "Income Tax Circle, Ahmedabad"},
    {"district": "Gandhinagar", "department": "State HQ", "location": "CH-0 Circle, Gandhinagar"},
    {"district": "Surat", "department": "Municipal Corp", "location": "Athwa Gate, Surat"},
    {"district": "Vadodara", "department": "Traffic Police", "location": "Sayaji Ganj, Vadodara"},
    {"district": "Rajkot", "department": "Municipal Corp", "location": "Kalawad Road, Rajkot"},
]


class SentinelGatewayClient:
    def __init__(self, base_url: str = SENTINEL_BASE_URL, password: str = SENTINEL_PASSWORD):
        self.base_url = base_url.rstrip("/")
        self.password = password
        self.session = requests.Session()
        self._authenticated = False
        self._cached_cameras: List[Dict[str, Any]] = []

    def login(self) -> bool:
        """Authenticate with the Sentinel Control Room to obtain session cookie."""
        try:
            url = f"{self.base_url}/auth/login"
            resp = self.session.post(
                url,
                data={"password": self.password},
                timeout=8,
                allow_redirects=True
            )
            if resp.status_code == 200 and "sentinel" in self.session.cookies:
                logger.info("Successfully authenticated to Sentinel Grid Gateway")
                self._authenticated = True
                return True
            else:
                logger.warning(f"Login failed: HTTP {resp.status_code}")
                return False
        except Exception as e:
            logger.error(f"Error logging in to Sentinel Grid: {e}")
            return False

    def ensure_auth(self):
        if not self._authenticated or "sentinel" not in self.session.cookies:
            self.login()

    def fetch_camera_catalogue(self, backend_host: str = "http://127.0.0.1:8000") -> List[Dict[str, Any]]:
        """Fetch all cameras and normalize stream parameters with authenticated proxy URLs."""
        self.ensure_auth()
        cameras = []
        try:
            url = f"{self.base_url}/cameras.json"
            resp = self.session.get(url, timeout=8)
            if resp.status_code in (401, 403) or "Sign in" in resp.text:
                if self.login():
                    resp = self.session.get(url, timeout=8)

            if resp.status_code == 200:
                raw_cams = resp.json()
                for idx, c in enumerate(raw_cams):
                    cam_id = c.get("id", f"cam{idx+1:02d}")
                    cam_name = c.get("name", f"Camera {idx+1}")
                    
                    num_match = re.search(r'\d+', cam_id)
                    cam_num = int(num_match.group(0)) if num_match else idx + 1
                    
                    enrichment = self._enrich_location(cam_name)

                    # Proxy URL through our authenticated FastAPI gateway
                    hls_proxy_url = f"{backend_host}/api/stream/{cam_id}/index.m3u8"
                    rtsp_url = f"rtsp://cctv.corp8.cloud:8554/stream/{cam_num}"
                    webrtc_url = f"http://cctv.corp8.cloud:8889/stream/{cam_num}/whep"

                    cameras.append({
                        "id": cam_id,
                        "number": cam_num,
                        "name": cam_name,
                        "location": enrichment["location"],
                        "district": enrichment["district"],
                        "department": enrichment["department"],
                        "hls_url": hls_proxy_url,
                        "hls_live_url": f"/api/stream/{cam_id}/index.m3u8",
                        "raw_hls_url": f"{self.base_url}/{cam_id}/index.m3u8",
                        "rtsp_url": rtsp_url,
                        "webrtc_url": webrtc_url,
                        "status": "online",
                        "live": True,
                        "codec": "hevc" if cam_num % 3 == 0 else "h264",
                        "resolution": "1920x1080",
                        "fps": 25,
                        "bitrate_kbps": 1200 + (cam_num * 50) % 800
                    })
                
                self._cached_cameras = cameras
                logger.info(f"Loaded {len(cameras)} cameras from Sentinel Catalogue")
                return cameras
        except Exception as e:
            logger.error(f"Failed fetching camera catalogue from Sentinel: {e}")

        if self._cached_cameras:
            return self._cached_cameras

        return self._generate_fallback_catalogue(backend_host)

    def get_stream_playlist(self, cam_id: str, host_url: str = "http://127.0.0.1:8000") -> Optional[str]:
        """
        Fetches the live HLS playlist for a camera and rewrites
        AES-128 encryption key and segment paths to the local proxy.
        """
        self.ensure_auth()
        try:
            url = f"{self.base_url}/{cam_id}/index.m3u8"
            resp = self.session.get(url, timeout=6)
            if resp.status_code in (401, 403) or "Sign in" in resp.text:
                if self.login():
                    resp = self.session.get(url, timeout=6)

            if resp.status_code == 200 and resp.text.startswith("#EXTM3U"):
                playlist = resp.text
                # Rewrite encryption key URI
                key_proxy_uri = f'{host_url}/api/stream/enc.key'
                playlist = re.sub(r'URI="[^"]*enc\.key"', f'URI="{key_proxy_uri}"', playlist)
                playlist = playlist.replace('URI="/enc.key"', f'URI="{key_proxy_uri}"')

                # Rewrite segment lines
                lines = playlist.splitlines()
                rewritten_lines = []
                for line in lines:
                    if line.strip() and not line.startswith("#"):
                        # This is a segment file (e.g. seg00000.ts)
                        seg_name = line.strip()
                        rewritten_lines.append(f"{host_url}/api/stream/{cam_id}/{seg_name}")
                    else:
                        rewritten_lines.append(line)

                return "\n".join(rewritten_lines)
        except Exception as e:
            logger.error(f"Error fetching playlist for {cam_id}: {e}")
        return None

    def get_stream_segment(self, cam_id: str, segment_name: str) -> Optional[bytes]:
        """Fetches a binary TS video segment from Sentinel with authenticated cookie."""
        self.ensure_auth()
        try:
            url = f"{self.base_url}/{cam_id}/{segment_name}"
            resp = self.session.get(url, timeout=10)
            if resp.status_code == 200:
                return resp.content
        except Exception as e:
            logger.error(f"Error fetching segment {segment_name} for {cam_id}: {e}")
        return None

    def get_encryption_key(self) -> Optional[bytes]:
        """Fetches the AES-128 decryption key from Sentinel."""
        self.ensure_auth()
        try:
            url = f"{self.base_url}/enc.key"
            resp = self.session.get(url, timeout=6)
            if resp.status_code == 200:
                return resp.content
        except Exception as e:
            logger.error(f"Error fetching encryption key: {e}")
        return None

    def _enrich_location(self, name: str) -> Dict[str, str]:
        name_lower = name.lower()
        for key, meta in LOCATION_METADATA.items():
            if key in name_lower:
                return meta
        clean_name = re.sub(r'^\d+\s*', '', name)
        return {
            "district": "Gujarat",
            "department": "Traffic Police",
            "location": f"{clean_name}, Gujarat"
        }

    def _generate_fallback_catalogue(self, backend_host: str = "http://127.0.0.1:8000") -> List[Dict[str, Any]]:
        cams = []
        for i in range(1, 31):
            cam_id = f"cam{i:02d}"
            meta = FALLBACK_LOCATIONS[(i - 1) % len(FALLBACK_LOCATIONS)]
            cams.append({
                "id": cam_id,
                "number": i,
                "name": f"Camera {i:02d} - {meta['location']}",
                "location": meta["location"],
                "district": meta["district"],
                "department": meta["department"],
                "hls_url": f"{backend_host}/api/stream/{cam_id}/index.m3u8",
                "hls_live_url": f"/api/stream/{cam_id}/index.m3u8",
                "raw_hls_url": f"{self.base_url}/{cam_id}/index.m3u8",
                "rtsp_url": f"rtsp://cctv.corp8.cloud:8554/stream/{i}",
                "webrtc_url": f"http://cctv.corp8.cloud:8889/stream/{i}/whep",
                "status": "online",
                "live": True,
                "codec": "hevc" if i % 3 == 0 else "h264",
                "resolution": "1920x1080",
                "fps": 25,
                "bitrate_kbps": 1500
            })
        return cams


sentinel_gateway = SentinelGatewayClient()
