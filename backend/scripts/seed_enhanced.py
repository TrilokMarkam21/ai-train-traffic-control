#!/usr/bin/env python3
"""
Enhanced Database Seeder for Presentation
Creates realistic, comprehensive train traffic data for demo purposes
"""

import os
import json
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from urllib.parse import quote_plus

def seed_database():
    print("\n[START] Starting MongoDB Seeding via Python...")
    print("[DATA] Creating comprehensive presentation dataset\n")

    # MongoDB Connection
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_train_traffic")

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.server_info()
        print("[OK] MongoDB connected\n")
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        sys.exit(1)

    db = client.get_database()

    # Clear existing collections
    print("[CLEAR] Clearing existing data...")
    collections_to_clear = ["trains", "sections", "predictions", "analytics"]
    for collection in collections_to_clear:
        if collection in db.list_collection_names():
            db[collection].delete_many({})
    print("[OK] Data cleared\n")

    # Seed Sections
    print("[SECTION] Seeding railway sections...")
    sections = [
        # Delhi to Mumbai route
        {
            "sectionId": "SEC-DEL-MTR",
            "name": "Delhi-Mathura",
            "startStation": "New Delhi",
            "endStation": "Mathura",
            "lengthMeters": 141000,
            "maxSpeedKmph": 130,
            "capacity": 2,
            "currentOccupancy": 1,
            "status": "Clear",
            "minHeadwaySec": 180,
        },
        {
            "sectionId": "SEC-MTR-AGR",
            "name": "Mathura-Agra",
            "startStation": "Mathura",
            "endStation": "Agra",
            "lengthMeters": 55000,
            "maxSpeedKmph": 120,
            "capacity": 1,
            "currentOccupancy": 1,
            "status": "Occupied",
            "minHeadwaySec": 240,
        },
        {
            "sectionId": "SEC-AGR-GWL",
            "name": "Agra-Gwalior",
            "startStation": "Agra",
            "endStation": "Gwalior",
            "lengthMeters": 120000,
            "maxSpeedKmph": 110,
            "capacity": 1,
            "currentOccupancy": 1,
            "status": "Occupied",
            "minHeadwaySec": 300,
        },
        {
            "sectionId": "SEC-GWL-BPL",
            "name": "Gwalior-Bhopal",
            "startStation": "Gwalior",
            "endStation": "Bhopal",
            "lengthMeters": 423000,
            "maxSpeedKmph": 130,
            "capacity": 2,
            "currentOccupancy": 2,
            "status": "Congested",
            "minHeadwaySec": 120,
        },
        {
            "sectionId": "SEC-BPL-ITRY",
            "name": "Bhopal-Itarsi",
            "startStation": "Bhopal",
            "endStation": "Itarsi",
            "lengthMeters": 78000,
            "maxSpeedKmph": 120,
            "capacity": 2,
            "currentOccupancy": 1,
            "status": "Clear",
            "minHeadwaySec": 180,
        },
        {
            "sectionId": "SEC-ITRY-BSL",
            "name": "Itarsi-Burhanpur",
            "startStation": "Itarsi",
            "endStation": "Burhanpur",
            "lengthMeters": 108000,
            "maxSpeedKmph": 110,
            "capacity": 1,
            "currentOccupancy": 0,
            "status": "Clear",
            "minHeadwaySec": 240,
        },
        {
            "sectionId": "SEC-BSL-MUM",
            "name": "Burhanpur-Mumbai",
            "startStation": "Burhanpur",
            "endStation": "Mumbai Central",
            "lengthMeters": 356000,
            "maxSpeedKmph": 130,
            "capacity": 2,
            "currentOccupancy": 1,
            "status": "Clear",
            "minHeadwaySec": 180,
        },
        # Delhi to Kolkata route
        {
            "sectionId": "SEC-DEL-HWH",
            "name": "New Delhi-Howrah",
            "startStation": "New Delhi",
            "endStation": "Howrah",
            "lengthMeters": 1472000,
            "maxSpeedKmph": 130,
            "capacity": 2,
            "currentOccupancy": 2,
            "status": "Congested",
            "minHeadwaySec": 120,
        },
        {
            "sectionId": "SEC-HWH-ASN",
            "name": "Howrah-Asansol",
            "startStation": "Howrah",
            "endStation": "Asansol",
            "lengthMeters": 214000,
            "maxSpeedKmph": 120,
            "capacity": 2,
            "currentOccupancy": 2,
            "status": "Congested",
            "minHeadwaySec": 120,
        },
        {
            "sectionId": "SEC-ASN-KPH",
            "name": "Asansol-Katihar",
            "startStation": "Asansol",
            "endStation": "Katihar",
            "lengthMeters": 368000,
            "maxSpeedKmph": 110,
            "capacity": 1,
            "currentOccupancy": 0,
            "status": "Clear",
            "minHeadwaySec": 180,
        },
        # Mumbai to Bangalore route
        {
            "sectionId": "SEC-MUM-PUNE",
            "name": "Mumbai-Pune",
            "startStation": "Mumbai Central",
            "endStation": "Pune",
            "lengthMeters": 192000,
            "maxSpeedKmph": 120,
            "capacity": 2,
            "currentOccupancy": 1,
            "status": "Clear",
            "minHeadwaySec": 180,
        },
        {
            "sectionId": "SEC-PUNE-SHO",
            "name": "Pune-Sholapur",
            "startStation": "Pune",
            "endStation": "Sholapur",
            "lengthMeters": 248000,
            "maxSpeedKmph": 110,
            "capacity": 1,
            "currentOccupancy": 1,
            "status": "Occupied",
            "minHeadwaySec": 240,
        },
        {
            "sectionId": "SEC-SHO-BANG",
            "name": "Sholapur-Bangalore",
            "startStation": "Sholapur",
            "endStation": "Bangalore",
            "lengthMeters": 560000,
            "maxSpeedKmph": 120,
            "capacity": 2,
            "currentOccupancy": 0,
            "status": "Clear",
            "minHeadwaySec": 180,
        },
        {
            "sectionId": "SEC-CHM-MDR",
            "name": "Chennai-Madras",
            "startStation": "Chennai Central",
            "endStation": "Madras",
            "lengthMeters": 50000,
            "maxSpeedKmph": 110,
            "capacity": 1,
            "currentOccupancy": 1,
            "status": "Occupied",
            "minHeadwaySec": 240,
        },
    ]

    section_result = db.sections.insert_many(sections)
    section_ids = section_result.inserted_ids
    print(f"✅ Created {len(sections)} railway sections\n")

    # Seed Trains
    print("🚆 Seeding trains with diverse statuses...")
    trains = [
        # Rajdhani Express (High Priority)
        {
            "trainNumber": "12951",
            "trainName": "Mumbai Rajdhani Express",
            "source": "New Delhi",
            "destination": "Mumbai Central",
            "departureTime": "17:40",
            "arrivalTime": "05:15",
            "status": "On Time",
            "priority": 1,
            "delay": 0,
            "currentSection": section_ids[0],
            "latitude": 28.6139,
            "longitude": 77.2090,
            "speedKmph": 125,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "12301",
            "trainName": "Howrah Rajdhani Express",
            "source": "New Delhi",
            "destination": "Howrah",
            "departureTime": "14:50",
            "arrivalTime": "08:25",
            "status": "Delayed",
            "priority": 1,
            "delay": 18,
            "currentSection": section_ids[8],
            "latitude": 26.5000,
            "longitude": 84.0000,
            "speedKmph": 95,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "12431",
            "trainName": "Lucknow Mail",
            "source": "New Delhi",
            "destination": "Lucknow",
            "departureTime": "12:20",
            "arrivalTime": "22:30",
            "status": "On Time",
            "priority": 1,
            "delay": 0,
            "currentSection": section_ids[0],
            "latitude": 28.4089,
            "longitude": 77.7064,
            "speedKmph": 120,
            "lastUpdated": datetime.now(),
        },
        # Express trains
        {
            "trainNumber": "12627",
            "trainName": "Karnataka Express",
            "source": "New Delhi",
            "destination": "Chennai Central",
            "departureTime": "23:30",
            "arrivalTime": "20:40",
            "status": "On Time",
            "priority": 2,
            "delay": 0,
            "currentSection": section_ids[3],
            "latitude": 26.4499,
            "longitude": 80.3319,
            "speedKmph": 100,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "19215",
            "trainName": "Gujarat Express",
            "source": "Ahmedabad",
            "destination": "Mumbai Central",
            "departureTime": "06:20",
            "arrivalTime": "14:15",
            "status": "Slightly Delayed",
            "priority": 2,
            "delay": 5,
            "currentSection": section_ids[6],
            "latitude": 23.0225,
            "longitude": 72.5714,
            "speedKmph": 85,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "12849",
            "trainName": "Pune-Howrah Express",
            "source": "Pune",
            "destination": "Howrah",
            "departureTime": "12:15",
            "arrivalTime": "10:35",
            "status": "In Transit",
            "priority": 2,
            "delay": 8,
            "currentSection": section_ids[11],
            "latitude": 19.5904,
            "longitude": 75.5941,
            "speedKmph": 90,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "12265",
            "trainName": "Bhopal Express",
            "source": "Bhopal",
            "destination": "Mumbai Central",
            "departureTime": "08:45",
            "arrivalTime": "16:00",
            "status": "On Time",
            "priority": 2,
            "delay": 0,
            "currentSection": section_ids[4],
            "latitude": 23.1815,
            "longitude": 79.9864,
            "speedKmph": 110,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "14715",
            "trainName": "Shershah Express",
            "source": "New Delhi",
            "destination": "Patna",
            "departureTime": "03:15",
            "arrivalTime": "15:40",
            "status": "Delayed",
            "priority": 2,
            "delay": 12,
            "currentSection": section_ids[8],
            "latitude": 27.7172,
            "longitude": 85.3240,
            "speedKmph": 80,
            "lastUpdated": datetime.now(),
        },
        # Passenger trains
        {
            "trainNumber": "12591",
            "trainName": "Gorakhpur Express",
            "source": "Gwalior",
            "destination": "Bengaluru",
            "departureTime": "06:15",
            "arrivalTime": "06:05",
            "status": "Significantly Delayed",
            "priority": 3,
            "delay": 32,
            "currentSection": section_ids[3],
            "latitude": 26.2124,
            "longitude": 78.1772,
            "speedKmph": 70,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "11015",
            "trainName": "Dadar Express",
            "source": "Mumbai Central",
            "destination": "Bangalore",
            "departureTime": "05:30",
            "arrivalTime": "20:45",
            "status": "On Time",
            "priority": 3,
            "delay": 0,
            "currentSection": section_ids[10],
            "latitude": 18.5204,
            "longitude": 73.8567,
            "speedKmph": 75,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "16795",
            "trainName": "Bangalore City Express",
            "source": "Bangalore",
            "destination": "Hyderabad",
            "departureTime": "18:30",
            "arrivalTime": "02:00",
            "status": "In Transit",
            "priority": 3,
            "delay": 15,
            "currentSection": section_ids[12],
            "latitude": 13.1939,
            "longitude": 77.5941,
            "speedKmph": 85,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "18567",
            "trainName": "Jaipur Intercity",
            "source": "New Delhi",
            "destination": "Jaipur",
            "departureTime": "07:00",
            "arrivalTime": "11:30",
            "status": "On Time",
            "priority": 3,
            "delay": 0,
            "currentSection": section_ids[0],
            "latitude": 27.5941,
            "longitude": 77.2064,
            "speedKmph": 110,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "20452",
            "trainName": "Visakhapatnam Express",
            "source": "Visakhapatnam",
            "destination": "New Delhi",
            "departureTime": "19:10",
            "arrivalTime": "14:40",
            "status": "Slightly Delayed",
            "priority": 2,
            "delay": 7,
            "currentSection": section_ids[8],
            "latitude": 17.6869,
            "longitude": 83.2185,
            "speedKmph": 95,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "18209",
            "trainName": "Shalimar Express",
            "source": "Howrah",
            "destination": "New Delhi",
            "departureTime": "11:55",
            "arrivalTime": "04:00",
            "status": "Delayed",
            "priority": 1,
            "delay": 22,
            "currentSection": section_ids[9],
            "latitude": 24.8407,
            "longitude": 81.8496,
            "speedKmph": 100,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "15902",
            "trainName": "Golden Temple Mail",
            "source": "Amritsar",
            "destination": "Mumbai Central",
            "departureTime": "15:35",
            "arrivalTime": "15:05",
            "status": "On Time",
            "priority": 2,
            "delay": 0,
            "currentSection": section_ids[1],
            "latitude": 31.6340,
            "longitude": 74.8711,
            "speedKmph": 115,
            "lastUpdated": datetime.now(),
        },
        {
            "trainNumber": "12216",
            "trainName": "Intercity Express",
            "source": "Chandigarh",
            "destination": "Delhi",
            "departureTime": "09:15",
            "arrivalTime": "12:10",
            "status": "On Time",
            "priority": 3,
            "delay": 0,
            "currentSection": section_ids[0],
            "latitude": 30.7333,
            "longitude": 76.7794,
            "speedKmph": 90,
            "lastUpdated": datetime.now(),
        },
    ]

    train_result = db.trains.insert_many(trains)
    print(f"✅ Created {len(trains)} trains with diverse statuses\n")

    # Seed Predictions
    print("🤖 Seeding AI predictions...")
    predictions = [
        {
            "trainNumber": "12951",
            "predictedDelay": 2,
            "confidence": 0.92,
            "factors": ["Normal weather conditions", "Clear track conditions", "High priority route"],
            "recommendation": "All systems normal. Maintain current schedule.",
            "timestamp": datetime.now(),
        },
        {
            "trainNumber": "12301",
            "predictedDelay": 25,
            "confidence": 0.88,
            "factors": ["Track congestion on AGR-GWL section", "High traffic volume", "Morning peak hours"],
            "recommendation": "Consider alternate routing. Expected delays: 20-30 minutes",
            "timestamp": datetime.now(),
        },
        {
            "trainNumber": "12627",
            "predictedDelay": 5,
            "confidence": 0.85,
            "factors": ["Light signals maintenance", "Mild delays anticipated"],
            "recommendation": "Monitor track status. Minor delays possible.",
            "timestamp": datetime.now(),
        },
    ]

    pred_result = db.predictions.insert_many(predictions)
    print(f"✅ Created {len(predictions)} AI predictions\n")

    # Seed Analytics
    print("📈 Seeding analytics data (7 days)...")
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
            "timestamp": datetime.now(),
        })

    analytics_result = db.analytics.insert_many(analytics)
    print(f"✅ Created {len(analytics)} analytics records\n")

    # Print Summary
    print("════════════════════════════════════════════════════════")
    print("✅ SEED COMPLETE - PRODUCTION DEMO DATA READY")
    print("════════════════════════════════════════════════════════\n")

    print("📊 Dataset Summary:")
    print(f"   • Railway Sections: {len(sections)}")
    print(f"   • Active Trains: {len(trains)}")
    print(f"   • AI Predictions: {len(predictions)}")
    print(f"   • Analytics Records: {len(analytics)} days\n")

    train_statuses = {}
    for train in trains:
        status = train.get("status", "Unknown")
        train_statuses[status] = train_statuses.get(status, 0) + 1

    print("🚆 Train Status Breakdown:")
    for status, count in sorted(train_statuses.items()):
        print(f"   • {status}: {count} trains")

    avg_delay = sum(t.get("delay", 0) for t in trains) / len(trains)
    print(f"   • Average Delay: {avg_delay:.1f} minutes\n")

    print("🎯 Ready to present! Start your demo at http://localhost:5173")
    print("════════════════════════════════════════════════════════\n")

    client.close()

if __name__ == "__main__":
    seed_database()
