import hashlib
import json
import os
import random
import string
from pathlib import Path

from flask import Flask, abort, render_template_string, request, send_from_directory
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)

FOLLOWERS = [
    "ava_nova",
    "milo.frames",
    "zara.snap",
    "leo.pixel",
    "ivy.moment",
    "nina.grid",
    "ryan.reels",
    "emma.capture",
    "liam.story",
    "sofia.lens",
]

MEDIA_DIR = Path(__file__).parent / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)


def random_md5() -> str:
    seed = os.urandom(32).hex() + str(random.random())
    return hashlib.md5(seed.encode(), usedforsecurity=False).hexdigest()


def generate_followers(count: int = 10):
    base_pool = FOLLOWERS[:]
    selected = random.sample(base_pool, count)
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return [f"{name}_{suffix}" for name in selected]


def split_into_three(value: str):
    base = len(value) // 3
    extra = len(value) % 3
    sizes = [base + (1 if i < extra else 0) for i in range(3)]

    parts = []
    start = 0
    for size in sizes:
        parts.append(value[start:start + size])
        start += size
    return parts


def random_noise_item(prefix: str, index: int):
    token = "".join(random.choices(string.ascii_lowercase + string.digits, k=14))
    return {"id": f"{prefix}_{index}", "token": token, "enabled": bool(index % 2)}


def build_noise_payload():
    return {
        "config": [random_noise_item("cfg", i) for i in range(200)],
        "notifications": [random_noise_item("notif", i) for i in range(300)],
        "stories": [random_noise_item("story", i) for i in range(400)],
        "ads": [random_noise_item("ad", i) for i in range(200)],
    }


def generate_image(username: str, text: str):
    width, height = 900, 520
    bg = (random.randint(40, 90), random.randint(40, 90), random.randint(40, 90))
    image = Image.new("RGB", (width, height), bg)
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(255, 255, 255), width=2)
    draw.text((40, 60), f"@{username}", fill=(255, 255, 255), font=font)
    draw.text((40, 130), text, fill=(255, 255, 255), font=font)

    out_path = MEDIA_DIR / f"{username}_post.png"
    image.save(out_path, format="PNG")


def escape_json_string(value: dict) -> str:
    raw = json.dumps(value, separators=(",", ":"))
    escaped = raw.replace("\\", "\\\\").replace('"', '\\"').replace("/", "\\/")
    return escaped


def build_shared_data(username: str, vulnerable_meta, cdn_host: str):
    noise = STATE["noise"]
    shared = {
        "entry_data": {
            "ProfilePage": [{"graphql": {"user": {"username": username, "is_private": True, "edge_owner_to_timeline_media": {"count": 1}}}}],
        },
        "viewer": {"username": "player_user", "following": 0, "followers": 10},
        "config": noise["config"],
        "notifications": noise["notifications"],
        "stories": noise["stories"],
        "ads": noise["ads"],
    }

    if vulnerable_meta:
        timeline = {
            "edges": [
                {
                    "node": {
                        "display_url": f"http://{cdn_host}/cdn/{username}/post.png"
                    }
                }
            ]
        }
        shared["polaris_timeline_connection"] = escape_json_string(timeline)

    return shared


def render_shared_data_script(shared):
    # Build manually so polaris_timeline_connection stays escaped exactly once in response text.
    lines = [
        "window._sharedData = {",
        f'  "entry_data": {json.dumps(shared["entry_data"], separators=(",", ":"))},',
        f'  "viewer": {json.dumps(shared["viewer"], separators=(",", ":"))},',
        f'  "config": {json.dumps(shared["config"], separators=(",", ":"))},',
        f'  "notifications": {json.dumps(shared["notifications"], separators=(",", ":"))},',
        f'  "stories": {json.dumps(shared["stories"], separators=(",", ":"))},',
        f'  "ads": {json.dumps(shared["ads"], separators=(",", ":"))}',
    ]

    polaris = shared.get("polaris_timeline_connection")
    if polaris is not None:
        lines[-1] += ","
        lines.append(f'  "polaris_timeline_connection": "{polaris}"')

    lines.append("};")
    return "\n".join(lines)


def init_state():
    incoming_flag = os.getenv("FLAG", "").strip()
    if incoming_flag:
        flag = incoming_flag
    else:
        flag = random_md5()

    followers = generate_followers(10)
    vulnerable_users = random.sample(followers, 3)
    parts = split_into_three(flag)

    vulnerable_map = {}
    for index, username in enumerate(vulnerable_users, start=1):
        vulnerable_map[username] = {
            "part_index": index,
            "part_value": parts[index - 1],
        }

    for user in followers:
        if user in vulnerable_map:
            info = vulnerable_map[user]
            generate_image(user, f"Part {info['part_index']}: {info['part_value']}")
        else:
            generate_image(user, "Nice photo 🙂")

    return {
        "flag": flag,
        "followers": followers,
        "vulnerable": vulnerable_map,
        "noise": build_noise_payload(),
    }


STATE = init_state()

HOME_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>InstaScam</title>
</head>
<body>
    <header>
        <nav class="navbar">
            <div class="container">
                <div class="logo">
                    <a href="/" class="brand-title">InstaScam</a>
                </div>
                <div class="searchbar">
                    <input type="text" placeholder="Search">
                </div>
                <div class="nav-links">
                    <ul class="nav-group">
                        <li class="nav-item">
                            <a href="/"><i class="fas fa-home"></i></a>
                        </li>
                        <li class="nav-item">
                            <div class="profile">
                                <i class="fas fa-user-circle"></i>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
    <main>
        <div class="container">
            <div class="col-9">
                <div class="statuses">
                    {% for user in followers %}
                    <div class="status">
                        <div class="image">
                            <a href="/user/{{ user }}"><img src="/cdn/{{ user }}/post.png" alt="story"></a>
                        </div>
                    </div>
                    {% endfor %}
                </div>
                <!-- Empty feed -> posts are hidden -->
                <div class="card" style="padding: 40px; text-align: center;">
                    <h2>Welcome to InstaScam</h2>
                    <p style="color: #8e8e8e; margin-top: 10px;">Select a follower to view their profile.</p>
                </div>
            </div>
            <div class="col-3">
                <div class="card" style="padding: 20px; border: none;">
                    <h4>Your Followers</h4>
                    <p style="font-size: 12px; margin-bottom: 15px; color: #8e8e8e;">Logged in as: player_user</p>
                    {% for user in followers %}
                    <div class="top" style="padding: 10px 0;">
                        <div class="userDetails">
                            <div class="profilepic">
                                <img src="/cdn/{{ user }}/post.png" alt="img">
                            </div>
                            <h3>{{ user }}<br>
                              <span>Follows You</span>
                            </h3>
                        </div>
                        <div>
                            <a href="/user/{{ user }}" class="follow">View</a>
                        </div>
                    </div>
                    {% endfor %}
                </div>
                <div class="footer">
                    <span class="footer-section">&copy; 2024 InstaScam</span>
                </div>
            </div>
        </div>
    </main>
</body>
</html>
"""

PROFILE_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>InstaScam | @{{ username }}</title>
</head>
<body>
    <header>
        <nav class="navbar">
            <div class="container">
                <div class="logo">
                    <a href="/" class="brand-title">InstaScam</a>
                </div>
                <div class="searchbar">
                    <input type="text" placeholder="Search">
                </div>
                <div class="nav-links">
                    <ul class="nav-group">
                        <li class="nav-item">
                            <a href="/"><i class="fas fa-home"></i></a>
                        </li>
                        <li class="nav-item">
                            <div class="profile">
                                <i class="fas fa-user-circle"></i>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
    <main>
        <div class="container">
            <div class="col-9">
                <div class="private-container">
                    <div class="locked-icon"><i class="fas fa-lock"></i></div>
                    <h2>@{{ username }}</h2>
                    <p><strong>This account is private</strong></p>
                    <p style="color: #8e8e8e; font-size: 14px;">Follow to see their posts and stories.</p>
                </div>
            </div>
            <div class="col-3">
                <div class="card" style="padding: 20px; border: none;">
                    <h4>Your Followers</h4>
                    <p style="font-size: 12px; margin-bottom: 15px; color: #8e8e8e;">Logged in as: player_user</p>
                    {% for user in followers %}
                    <div class="top" style="padding: 10px 0;">
                        <div class="userDetails">
                            <div class="profilepic">
                                <img src="/cdn/{{ user }}/post.png" alt="img">
                            </div>
                            <h3>{{ user }}<br>
                              <span>Follows You</span>
                            </h3>
                        </div>
                        <div>
                            <a href="/user/{{ user }}" class="follow" style="{% if user == username %}color: #262626;{% endif %}">View</a>
                        </div>
                    </div>
                    {% endfor %}
                </div>
                <div class="footer">
                    <span class="footer-section">&copy; 2024 InstaScam</span>
                </div>
            </div>
        </div>
    </main>
    <script>
{{ shared_data_script|safe }}
    </script>
</body>
</html>
"""


@app.route("/")
def home():
    return render_template_string(HOME_TEMPLATE, followers=STATE["followers"])


@app.route("/style.css")
def serve_css():
    return send_from_directory(Path(__file__).parent, "style.css")


@app.route("/user/<username>")
def profile(username):
    if username not in STATE["followers"]:
        abort(404)

    vulnerable_meta = STATE["vulnerable"].get(username)
    shared = build_shared_data(username, vulnerable_meta, request.host)
    shared_data_script = render_shared_data_script(shared)

    return render_template_string(
        PROFILE_TEMPLATE,
        username=username,
        followers=STATE["followers"],
        shared_data_script=shared_data_script,
    )


@app.route("/cdn/<username>/post.png")
def cdn_image(username):
    if username not in STATE["followers"]:
        abort(404)

    file_name = f"{username}_post.png"
    return send_from_directory(MEDIA_DIR, file_name)


@app.route("/healthz")
def healthz():
    return {"ok": True}


@app.route("/debug/parts")
def debug_parts():
    if os.getenv("ENABLE_TEST_DEBUG", "0") != "1":
        abort(404)

    parts = sorted(
        [
            {
                "part_index": info["part_index"],
                "value": info["part_value"],
            }
            for info in STATE["vulnerable"].values()
        ],
        key=lambda item: item["part_index"],
    )

    return {
        "enabled": True,
        "parts": parts,
    }


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
