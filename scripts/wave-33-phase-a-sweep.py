"""Wave 33 Phase A — same algorithm as Stage 4, scope: service-pillar + city + outdoor."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module

stage4 = import_module("wave-33-stage4-sweep")

# Override category filter
stage4.STAGE4_CATEGORIES = {"service-pillar", "city-pillar-or-root", "outdoor"}

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "dry-run"
    if mode == "dry-run":
        stage4.cmd_dry_run()
    elif mode == "apply":
        stage4.cmd_apply()
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)
