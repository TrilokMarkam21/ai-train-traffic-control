#!/usr/bin/env python
"""
Quick Ensemble Setup Script
===========================
Run this script to set up the ensemble system:
1. Install TensorFlow
2. Train the deep learning model
3. Verify ensemble is working
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(cmd: str, description: str) -> bool:
    """Run a command and report results."""
    print(f"\n{'='*60}")
    print(f"→ {description}")
    print(f"{'='*60}")
    print(f"Command: {cmd}\n")
    
    result = subprocess.run(cmd, shell=True)
    return result.returncode == 0


def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║           Ensemble ML System Setup Script                    ║
║   RandomForest + Deep Learning for Maximum Accuracy          ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    ai_service_dir = Path(__file__).parent.absolute()
    os.chdir(ai_service_dir)
    
    # Step 1: Install TensorFlow
    step1_ok = run_command(
        f"{sys.executable} -m pip install --upgrade tensorflow keras",
        "Step 1: Installing TensorFlow and Keras"
    )
    
    if not step1_ok:
        print("\n❌ Failed to install TensorFlow. Please install manually:")
        print(f"   {sys.executable} -m pip install tensorflow")
        return False
    
    print("\n✓ TensorFlow installed successfully")
    
    # Step 2: Check data exists
    print(f"\n{'='*60}")
    print("Step 2: Checking training data")
    print(f"{'='*60}")
    
    data_file = ai_service_dir / "railway_data.csv"
    if not data_file.exists():
        print(f"⚠ Warning: {data_file} not found")
        print("  Generating realistic data first...")
        run_command(
            f"{sys.executable} example_real_data_training.py",
            "Generating realistic railway data"
        )
    else:
        print(f"✓ Training data found: {data_file}")
        # Show data info
        with open(data_file, 'r') as f:
            lines = len(f.readlines())
        print(f"  Records: {lines - 1}")  # Subtract header
    
    # Step 3: Train Deep Learning Model
    step3_ok = run_command(
        f"{sys.executable} train_model_deep_learning.py",
        "Step 3: Training Deep Learning Model"
    )
    
    if not step3_ok:
        print("\n❌ Failed to train deep learning model")
        return False
    
    print("\n✓ Deep learning model trained successfully")
    
    # Step 4: Verify ensemble
    print(f"\n{'='*60}")
    print("Step 4: Verifying ensemble setup")
    print(f"{'='*60}\n")
    
    rf_model = ai_service_dir / "model" / "train_model.pkl"
    dl_model = ai_service_dir / "model" / "train_model_dl.h5"
    scaler_stats = ai_service_dir / "model" / "scaler_stats.json"
    
    checks = [
        (rf_model, "RandomForest model"),
        (dl_model, "Deep Learning model"),
        (scaler_stats, "Scaler statistics"),
    ]
    
    all_ok = True
    for path, name in checks:
        if path.exists():
            size_mb = path.stat().st_size / (1024 * 1024)
            print(f"✓ {name}: {path.name} ({size_mb:.1f} MB)")
        else:
            print(f"✗ {name}: {path.name} (NOT FOUND)")
            all_ok = False
    
    if not all_ok:
        print("\n❌ Some files missing. Check training output above.")
        return False
    
    print(f"\n{'='*60}")
    print("✅ Ensemble Setup Complete!")
    print(f"{'='*60}\n")
    
    print("Next steps:")
    print("1. Start the AI service:")
    print(f"   python -m uvicorn app.main:app --reload --port 8000\n")
    print("2. Visit http://localhost:8000/docs to test predictions")
    print("3. Check /v1/models endpoint to confirm both models loaded\n")
    
    print("Test with:")
    print("   curl http://localhost:8000/v1/models\n")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
