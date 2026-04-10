#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient

def seed_database():
    print("\n[SEED] Starting MongoDB Seeding...")
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_train_traffic")

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.server_info()
        print("[OK] MongoDB connected")
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)

    db = client.get_database()

    # Clear
    print("[CLEAR] Clearing existing data...")
    for col in ["trains", "sections", "predictions", "analytics"]:
        if col in db.list_collection_names():
            db[col].delete_many({})

    # Sections
    print("[CREATE] Sections...")
    sections = [
        {"sectionId": "SEC-DEL-MTR", "name": "Delhi-Mathura", "startStation": "New Delhi", "endStation": "Mathura", "lengthMeters": 141000, "maxSpeedKmph": 130, "capacity": 2, "currentOccupancy": 1, "status": "Clear", "minHeadwaySec": 180},
        {"sectionId": "SEC-MTR-AGR", "name": "Mathura-Agra", "startStation": "Mathura", "endStation": "Agra", "lengthMeters": 55000, "maxSpeedKmph": 120, "capacity": 1, "currentOccupancy": 1, "status": "Occupied", "minHeadwaySec": 240},
        {"sectionId": "SEC-AGR-GWL", "name": "Agra-Gwalior", "startStation": "Agra", "endStation": "Gwalior", "lengthMeters": 120000, "maxSpeedKmph": 110, "capacity": 1, "currentOccupancy": 1, "status": "Occupied", "minHeadwaySec": 300},
        {"sectionId": "SEC-GWL-BPL", "name": "Gwalior-Bhopal", "startStation": "Gwalior", "endStation": "Bhopal", "lengthMeters": 423000, "maxSpeedKmph": 130, "capacity": 2, "currentOccupancy": 2, "status": "Congested", "minHeadwaySec": 120},
        {"sectionId": "SEC-BPL-ITRY", "name": "Bhopal-Itarsi", "startStation": "Bhopal", "endStation": "Itarsi", "lengthMeters": 78000, "maxSpeedKmph": 120, "capacity": 2, "currentOccupancy": 1, "status": "Clear", "minHeadwaySec": 180},
        {"sectionId": "SEC-ITRY-BSL", "name": "Itarsi-Burhanpur", "startStation": "Itarsi", "endStation": "Burhanpur", "lengthMeters": 108000, "maxSpeedKmph": 110, "capacity": 1, "currentOccupancy": 0, "status": "Clear", "minHeadwaySec": 240},
        {"sectionId": "SEC-BSL-MUM", "name": "Burhanpur-Mumbai", "startStation": "Burhanpur", "endStation": "Mumbai Central", "lengthMeters": 356000, "maxSpeedKmph": 130, "capacity": 2, "currentOccupancy": 1, "status": "Clear", "minHeadwaySec": 180},
        {"sectionId": "SEC-DEL-HWH", "name": "New Delhi-Howrah", "startStation": "New Delhi", "endStation": "Howrah", "lengthMeters": 1472000, "maxSpeedKmph": 130, "capacity": 2, "currentOccupancy": 2, "status": "Congested", "minHeadwaySec": 120},
        {"sectionId": "SEC-HWH-ASN", "name": "Howrah-Asansol", "startStation": "Howrah", "endStation": "Asansol", "lengthMeters": 214000, "maxSpeedKmph": 120, "capacity": 2, "currentOccupancy": 2, "status": "Congested", "minHeadwaySec": 120},
        {"sectionId": "SEC-ASN-KPH", "name": "Asansol-Katihar", "startStation": "Asansol", "endStation": "Katihar", "lengthMeters": 368000, "maxSpeedKmph": 110, "capacity": 1, "currentOccupancy": 0, "status": "Clear", "minHeadwaySec": 180},
        {"sectionId": "SEC-MUM-PUNE", "name": "Mumbai-Pune", "startStation": "Mumbai Central", "endStation": "Pune", "lengthMeters": 192000, "maxSpeedKmph": 120, "capacity": 2, "currentOccupancy": 1, "status": "Clear", "minHeadwaySec": 180},
        {"sectionId": "SEC-PUNE-SHO", "name": "Pune-Sholapur", "startStation": "Pune", "endStation": "Sholapur", "lengthMeters": 248000, "maxSpeedKmph": 110, "capacity": 1, "currentOccupancy": 1, "status": "Occupied", "minHeadwaySec": 240},
        {"sectionId": "SEC-SHO-BANG", "name": "Sholapur-Bangalore", "startStation": "Sholapur", "endStation": "Bangalore", "lengthMeters": 560000, "maxSpeedKmph": 120, "capacity": 2, "currentOccupancy": 0, "status": "Clear", "minHeadwaySec": 180},
        {"sectionId": "SEC-CHM-MDR", "name": "Chennai-Madras", "startStation": "Chennai Central", "endStation": "Madras", "lengthMeters": 50000, "maxSpeedKmph": 110, "capacity": 1, "currentOccupancy": 1, "status": "Occupied", "minHeadwaySec": 240},
    ]
    sec_res = db.sections.insert_many(sections)
    section_ids = sec_res.inserted_ids
    print(f"[OK] {len(sections)} sections created")

    # Trains
    print("[CREATE] Trains...")
    trains = [
        {"trainNumber": "12951", "trainName": "Mumbai Rajdhani Express", "source": "New Delhi", "destination": "Mumbai Central", "departureTime": "17:40", "arrivalTime": "05:15", "status": "On Time", "priority": 1, "delay": 0, "currentSection": section_ids[0], "latitude": 28.6139, "longitude": 77.2090, "speedKmph": 125, "lastUpdated": datetime.now()},
        {"trainNumber": "12301", "trainName": "Howrah Rajdhani Express", "source": "New Delhi", "destination": "Howrah", "departureTime": "14:50", "arrivalTime": "08:25", "status": "Delayed", "priority": 1, "delay": 18, "currentSection": section_ids[8], "latitude": 26.5000, "longitude": 84.0000, "speedKmph": 95, "lastUpdated": datetime.now()},
        {"trainNumber": "12431", "trainName": "Lucknow Mail", "source": "New Delhi", "destination": "Lucknow", "departureTime": "12:20", "arrivalTime": "22:30", "status": "On Time", "priority": 1, "delay": 0, "currentSection": section_ids[0], "latitude": 28.4089, "longitude": 77.7064, "speedKmph": 120, "lastUpdated": datetime.now()},
        {"trainNumber": "12627", "trainName": "Karnataka Express", "source": "New Delhi", "destination": "Chennai Central", "departureTime": "23:30", "arrivalTime": "20:40", "status": "On Time", "priority": 2, "delay": 0, "currentSection": section_ids[3], "latitude": 26.4499, "longitude": 80.3319, "speedKmph": 100, "lastUpdated": datetime.now()},
        {"trainNumber": "19215", "trainName": "Gujarat Express", "source": "Ahmedabad", "destination": "Mumbai Central", "departureTime": "06:20", "arrivalTime": "14:15", "status": "Slightly Delayed", "priority": 2, "delay": 5, "currentSection": section_ids[6], "latitude": 23.0225, "longitude": 72.5714, "speedKmph": 85, "lastUpdated": datetime.now()},
        {"trainNumber": "12849", "trainName": "Pune-Howrah Express", "source": "Pune", "destination": "Howrah", "departureTime": "12:15", "arrivalTime": "10:35", "status": "In Transit", "priority": 2, "delay": 8, "currentSection": section_ids[11], "latitude": 19.5904, "longitude": 75.5941, "speedKmph": 90, "lastUpdated": datetime.now()},
        {"trainNumber": "12265", "trainName": "Bhopal Express", "source": "Bhopal", "destination": "Mumbai Central", "departureTime": "08:45", "arrivalTime": "16:00", "status": "On Time", "priority": 2, "delay": 0, "currentSection": section_ids[4], "latitude": 23.1815, "longitude": 79.9864, "speedKmph": 110, "lastUpdated": datetime.now()},
        {"trainNumber": "14715", "trainName": "Shershah Express", "source": "New Delhi", "destination": "Patna", "departureTime": "03:15", "arrivalTime": "15:40", "status": "Delayed", "priority": 2, "delay": 12, "currentSection": section_ids[8], "latitude": 27.7172, "longitude": 85.3240, "speedKmph": 80, "lastUpdated": datetime.now()},
        {"trainNumber": "12591", "trainName": "Gorakhpur Express", "source": "Gwalior", "destination": "Bengaluru", "departureTime": "06:15", "arrivalTime": "06:05", "status": "Significantly Delayed", "priority": 3, "delay": 32, "currentSection": section_ids[3], "latitude": 26.2124, "longitude": 78.1772, "speedKmph": 70, "lastUpdated": datetime.now()},
        {"trainNumber": "11015", "trainName": "Dadar Express", "source": "Mumbai Central", "destination": "Bangalore", "departureTime": "05:30", "arrivalTime": "20:45", "status": "On Time", "priority": 3, "delay": 0, "currentSection": section_ids[10], "latitude": 18.5204, "longitude": 73.8567, "speedKmph": 75, "lastUpdated": datetime.now()},
        {"trainNumber": "16795", "trainName": "Bangalore City Express", "source": "Bangalore", "destination": "Hyderabad", "departureTime": "18:30", "arrivalTime": "02:00", "status": "In Transit", "priority": 3, "delay": 15, "currentSection": section_ids[12], "latitude": 13.1939, "longitude": 77.5941, "speedKmph": 85, "lastUpdated": datetime.now()},
        {"trainNumber": "18567", "trainName": "Jaipur Intercity", "source": "New Delhi", "destination": "Jaipur", "departureTime": "07:00", "arrivalTime": "11:30", "status": "On Time", "priority": 3, "delay": 0, "currentSection": section_ids[0], "latitude": 27.5941, "longitude": 77.2064, "speedKmph": 110, "lastUpdated": datetime.now()},
        {"trainNumber": "20452", "trainName": "Visakhapatnam Express", "source": "Visakhapatnam", "destination": "New Delhi", "departureTime": "19:10", "arrivalTime": "14:40", "status": "Slightly Delayed", "priority": 2, "delay": 7, "currentSection": section_ids[8], "latitude": 17.6869, "longitude": 83.2185, "speedKmph": 95, "lastUpdated": datetime.now()},
        {"trainNumber": "18209", "trainName": "Shalimar Express", "source": "Howrah", "destination": "New Delhi", "departureTime": "11:55", "arrivalTime": "04:00", "status": "Delayed", "priority": 1, "delay": 22, "currentSection": section_ids[9], "latitude": 24.8407, "longitude": 81.8496, "speedKmph": 100, "lastUpdated": datetime.now()},
        {"trainNumber": "15902", "trainName": "Golden Temple Mail", "source": "Amritsar", "destination": "Mumbai Central", "departureTime": "15:35", "arrivalTime": "15:05", "status": "On Time", "priority": 2, "delay": 0, "currentSection": section_ids[1], "latitude": 31.6340, "longitude": 74.8711, "speedKmph": 115, "lastUpdated": datetime.now()},
        {"trainNumber": "12216", "trainName": "Intercity Express", "source": "Chandigarh", "destination": "Delhi", "departureTime": "09:15", "arrivalTime": "12:10", "status": "On Time", "priority": 3, "delay": 0, "currentSection": section_ids[0], "latitude": 30.7333, "longitude": 76.7794, "speedKmph": 90, "lastUpdated": datetime.now()},
    ]
    train_res = db.trains.insert_many(trains)
    print(f"[OK] {len(trains)} trains created")

    # Predictions
    print("[CREATE] Predictions...")
    predictions = [
        {"trainNumber": "12951", "predictedDelay": 2, "confidence": 0.92, "factors": ["Normal weather", "Clear tracks", "Priority route"], "recommendation": "All normal. Maintain schedule.", "timestamp": datetime.now()},
        {"trainNumber": "12301", "predictedDelay": 25, "confidence": 0.88, "factors": ["Congestion on AGR-GWL", "High traffic", "Peak hours"], "recommendation": "Expect 20-30 min delays", "timestamp": datetime.now()},
        {"trainNumber": "12627", "predictedDelay": 5, "confidence": 0.85, "factors": ["Signal maintenance", "Minor delays"], "recommendation": "Monitor track status", "timestamp": datetime.now()},
    ]
    pred_res = db.predictions.insert_many(predictions)
    print(f"[OK] {len(predictions)} predictions created")

    # Analytics
    print("[CREATE] Analytics...")
    analytics = []
    for i in range(7):
        date = datetime.now() - timedelta(days=6-i)
        analytics.append({
            "date": date,
            "totalTrains": 150 + i * 2,
            "onTimeTrains": 135 + i,
            "delayedTrains": 15 - i,
            "averageDelay": 5.5 - i * 0.3,
            "highPriorityCount": 45 + i,
            "congestionLevel": ["Low", "Medium", "High"][i % 3],
        })
    an_res = db.analytics.insert_many(analytics)
    print(f"[OK] {len(analytics)} analytics records created")

    # Summary
    print("\n[SUCCESS] Seeding complete!")
    print(f"  Sections: {len(sections)}")
    print(f"  Trains: {len(trains)}")
    print(f"  Predictions: {len(predictions)}")
    print(f"  Analytics: {len(analytics)} days\n")

    status_count = {}
    for train in trains:
        s = train.get("status", "Unknown")
        status_count[s] = status_count.get(s, 0) + 1

    print("[TRAIN STATUS]")
    for status, count in sorted(status_count.items()):
        print(f"  {status}: {count}")

    avg_delay = sum(t.get("delay", 0) for t in trains) / len(trains)
    print(f"  Average Delay: {avg_delay:.1f} min\n")

    print("[READY] Demo data seeded! Visit http://localhost:5173")
    client.close()

if __name__ == "__main__":
    seed_database()
