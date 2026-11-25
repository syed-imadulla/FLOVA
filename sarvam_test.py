import os
from pathlib import Path
from sarvamai import SarvamAI


def load_api_key() -> str:
    key = os.environ.get("SARVAM_API_KEY", "").strip()
    if key:
        return key
    env_path = Path(__file__).with_name(".env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("SARVAM_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def main() -> None:
    api_key = load_api_key()
    if not api_key:
        raise SystemExit("SARVAM_API_KEY is missing. Paste your key into .env and re-run.")

    client = SarvamAI(api_subscription_key=api_key)
    response = client.chat.completions(
        model="sarvam-105b-conversations",
        messages=[{"role": "user", "content": "Say hello in one short sentence."}],
    )
    print(response.choices[0].message.content)


if __name__ == "__main__":
    main()
