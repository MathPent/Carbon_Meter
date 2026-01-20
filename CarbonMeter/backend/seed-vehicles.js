const mongoose = require('mongoose');
const Vehicle = require('./src/models/Vehicle');
const connectDB = require('./src/config/database');

// Vehicle dataset
const vehiclesData = [
  {
    "model": "Hero Splendor Plus",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "97.2cc",
    "mileage": 70.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.033
  },
  {
    "model": "Hero HF Deluxe",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "97.2cc",
    "mileage": 70.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.033
  },
  {
    "model": "Honda Activa 6G",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "109.5cc",
    "mileage": 55.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.042
  },
  {
    "model": "Honda Shine 125",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "124cc",
    "mileage": 65.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0355
  },
  {
    "model": "TVS Jupiter 110",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "109.7cc",
    "mileage": 62.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0373
  },
  {
    "model": "Bajaj Platina 100",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "102cc",
    "mileage": 72.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0321
  },
  {
    "model": "Bajaj Pulsar 150",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "149.5cc",
    "mileage": 47.5,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0486
  },
  {
    "model": "Royal Enfield Classic 350",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "349cc",
    "mileage": 41.55,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0556
  },
  {
    "model": "Royal Enfield Hunter 350",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "349cc",
    "mileage": 36.2,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0638
  },
  {
    "model": "TVS Apache RTR 160",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "159.7cc",
    "mileage": 45.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0513
  },
  {
    "model": "Yamaha FZ-S Fi",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "149cc",
    "mileage": 45.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0513
  },
  {
    "model": "Suzuki Access 125",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "124cc",
    "mileage": 52.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0444
  },
  {
    "model": "TVS Raider 125",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "124.8cc",
    "mileage": 67.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0345
  },
  {
    "model": "KTM 200 Duke",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "199.5cc",
    "mileage": 35.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.066
  },
  {
    "model": "Yamaha R15 V4",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "155cc",
    "mileage": 40.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0578
  },
  {
    "model": "Bajaj Dominar 400",
    "category": "Two-wheeler",
    "fuel": "Petrol",
    "engine": "373.3cc",
    "mileage": 29.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0797
  },
  {
    "model": "Ola S1 Pro (EV)",
    "category": "Two-wheeler",
    "fuel": "Electric",
    "engine": "4 kWh Battery",
    "mileage": 48.75,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0168
  },
  {
    "model": "Ather 450X (EV)",
    "category": "Two-wheeler",
    "fuel": "Electric",
    "engine": "3.7 kWh Battery",
    "mileage": 40.5,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0202
  },
  {
    "model": "TVS iQube (EV)",
    "category": "Two-wheeler",
    "fuel": "Electric",
    "engine": "3.04 kWh Battery",
    "mileage": 32.9,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0249
  },
  {
    "model": "Bajaj Chetak (EV)",
    "category": "Two-wheeler",
    "fuel": "Electric",
    "engine": "2.9 kWh Battery",
    "mileage": 37.2,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.022
  },
  {
    "model": "Maruti Alto K10",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "998cc",
    "mileage": 24.39,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0947
  },
  {
    "model": "Maruti Alto K10 CNG",
    "category": "Four-wheeler",
    "fuel": "CNG",
    "engine": "998cc",
    "mileage": 33.85,
    "mileage_unit": "km/kg",
    "co2_factor": 2.75,
    "co2_per_km": 0.0812
  },
  {
    "model": "Maruti Wagon R 1.0",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "998cc",
    "mileage": 24.35,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0949
  },
  {
    "model": "Maruti Wagon R CNG",
    "category": "Four-wheeler",
    "fuel": "CNG",
    "engine": "998cc",
    "mileage": 34.05,
    "mileage_unit": "km/kg",
    "co2_factor": 2.75,
    "co2_per_km": 0.0808
  },
  {
    "model": "Maruti Swift",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1197cc",
    "mileage": 22.38,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1032
  },
  {
    "model": "Maruti Dzire",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1197cc",
    "mileage": 22.41,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1031
  },
  {
    "model": "Maruti Dzire CNG",
    "category": "Four-wheeler",
    "fuel": "CNG",
    "engine": "1197cc",
    "mileage": 31.12,
    "mileage_unit": "km/kg",
    "co2_factor": 2.75,
    "co2_per_km": 0.0884
  },
  {
    "model": "Maruti Baleno",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1197cc",
    "mileage": 22.35,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1034
  },
  {
    "model": "Maruti Brezza",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1462cc",
    "mileage": 17.38,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1329
  },
  {
    "model": "Maruti Brezza CNG",
    "category": "Four-wheeler",
    "fuel": "CNG",
    "engine": "1462cc",
    "mileage": 25.51,
    "mileage_unit": "km/kg",
    "co2_factor": 2.75,
    "co2_per_km": 0.1078
  },
  {
    "model": "Maruti Ertiga",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1462cc",
    "mileage": 20.51,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1126
  },
  {
    "model": "Maruti Ertiga CNG",
    "category": "Four-wheeler",
    "fuel": "CNG",
    "engine": "1462cc",
    "mileage": 26.11,
    "mileage_unit": "km/kg",
    "co2_factor": 2.75,
    "co2_per_km": 0.1053
  },
  {
    "model": "Tata Tiago",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1199cc",
    "mileage": 19.01,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1215
  },
  {
    "model": "Tata Punch",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1199cc",
    "mileage": 18.97,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1218
  },
  {
    "model": "Tata Nexon Petrol",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.2L Turbo",
    "mileage": 17.33,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1333
  },
  {
    "model": "Tata Nexon Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "1.5L Turbo",
    "mileage": 23.22,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1154
  },
  {
    "model": "Tata Harrier",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.0L Turbo",
    "mileage": 16.35,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1639
  },
  {
    "model": "Tata Safari",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.0L Turbo",
    "mileage": 16.14,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.166
  },
  {
    "model": "Hyundai Grand i10 Nios",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1197cc",
    "mileage": 20.7,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1116
  },
  {
    "model": "Hyundai Creta Petrol",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.5L MPi",
    "mileage": 17.4,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1328
  },
  {
    "model": "Hyundai Creta Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "1.5L CRDi",
    "mileage": 21.8,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1229
  },
  {
    "model": "Hyundai Venue",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.2L Kappa",
    "mileage": 17.5,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.132
  },
  {
    "model": "Mahindra Scorpio N Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.2L mHawk",
    "mileage": 15.4,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.174
  },
  {
    "model": "Mahindra XUV700 Petrol",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "2.0L Turbo",
    "mileage": 11.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.21
  },
  {
    "model": "Mahindra XUV700 Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.2L mHawk",
    "mileage": 16.5,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1624
  },
  {
    "model": "Mahindra Thar Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.2L mHawk",
    "mileage": 15.2,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1763
  },
  {
    "model": "Mahindra Bolero Neo",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "1.5L mHawk",
    "mileage": 17.29,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.155
  },
  {
    "model": "Toyota Innova Crysta",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.4L",
    "mileage": 12.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.2233
  },
  {
    "model": "Toyota Innova Hycross Hybrid",
    "category": "Four-wheeler",
    "fuel": "Petrol Hybrid",
    "engine": "2.0L",
    "mileage": 23.24,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0994
  },
  {
    "model": "Toyota Fortuner Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.8L",
    "mileage": 10.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.268
  },
  {
    "model": "Toyota Urban Cruiser Hyryder",
    "category": "Four-wheeler",
    "fuel": "Petrol Hybrid",
    "engine": "1.5L Hybrid",
    "mileage": 27.97,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.0826
  },
  {
    "model": "Honda City Petrol",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.5L i-VTEC",
    "mileage": 17.8,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1298
  },
  {
    "model": "Honda Amaze",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.2L i-VTEC",
    "mileage": 18.6,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1242
  },
  {
    "model": "Kia Seltos Petrol",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.5L",
    "mileage": 17.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1359
  },
  {
    "model": "Kia Seltos Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "1.5L CRDi",
    "mileage": 20.8,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1288
  },
  {
    "model": "Renault Kwid",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.0L",
    "mileage": 22.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.105
  },
  {
    "model": "Renault Triber",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.0L",
    "mileage": 20.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1155
  },
  {
    "model": "Nissan Magnite",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "1.0L Turbo",
    "mileage": 20.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.1155
  },
  {
    "model": "Jeep Compass Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.0L",
    "mileage": 17.1,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1567
  },
  {
    "model": "Mercedes-Benz C-Class Diesel",
    "category": "Four-wheeler",
    "fuel": "Diesel",
    "engine": "2.0L",
    "mileage": 23.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1165
  },
  {
    "model": "BMW 3 Series Gran Limousine",
    "category": "Four-wheeler",
    "fuel": "Petrol",
    "engine": "2.0L Turbo",
    "mileage": 15.3,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.151
  },
  {
    "model": "Tata Nexon EV LR",
    "category": "Four-wheeler",
    "fuel": "Electric",
    "engine": "40.5 kWh Battery",
    "mileage": 11.48,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0714
  },
  {
    "model": "Tata Tiago EV MR",
    "category": "Four-wheeler",
    "fuel": "Electric",
    "engine": "19.2 kWh Battery",
    "mileage": 13.02,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.063
  },
  {
    "model": "MG ZS EV",
    "category": "Four-wheeler",
    "fuel": "Electric",
    "engine": "50.3 kWh Battery",
    "mileage": 9.16,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0895
  },
  {
    "model": "Mahindra XUV400 EV",
    "category": "Four-wheeler",
    "fuel": "Electric",
    "engine": "39.4 kWh Battery",
    "mileage": 11.57,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0709
  },
  {
    "model": "Tata Punch EV LR",
    "category": "Four-wheeler",
    "fuel": "Electric",
    "engine": "35 kWh Battery",
    "mileage": 12.0,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0683
  },
  {
    "model": "Hyundai Ioniq 5",
    "category": "Four-wheeler",
    "fuel": "Electric",
    "engine": "72.6 kWh Battery",
    "mileage": 8.69,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0943
  },
  {
    "model": "Kia EV6",
    "category": "Four-wheeler",
    "fuel": "Electric",
    "engine": "77.4 kWh Battery",
    "mileage": 9.14,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.0897
  },
  {
    "model": "Tata Ace Gold Diesel",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "700cc",
    "mileage": 22.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1218
  },
  {
    "model": "Tata Ace Gold Petrol",
    "category": "Truck",
    "fuel": "Petrol",
    "engine": "694cc",
    "mileage": 21.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.31,
    "co2_per_km": 0.11
  },
  {
    "model": "Tata Ace Gold CNG",
    "category": "Truck",
    "fuel": "CNG",
    "engine": "694cc",
    "mileage": 21.4,
    "mileage_unit": "km/kg",
    "co2_factor": 2.75,
    "co2_per_km": 0.1285
  },
  {
    "model": "Mahindra Jeeto Diesel",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "670cc",
    "mileage": 35.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.0766
  },
  {
    "model": "Ashok Leyland Dost+",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "1.5L Turbo",
    "mileage": 19.6,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1367
  },
  {
    "model": "Ashok Leyland Bada Dost",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "1.5L Turbo",
    "mileage": 14.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1914
  },
  {
    "model": "Mahindra Bolero Pickup 1.7T",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "2.5L",
    "mileage": 14.3,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1874
  },
  {
    "model": "Tata Intra V30",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "1.5L",
    "mileage": 17.6,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1523
  },
  {
    "model": "Tata Yodha Pickup",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "2.2L",
    "mileage": 15.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.1787
  },
  {
    "model": "Tata 407 Gold SFC",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "3.0L",
    "mileage": 10.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.268
  },
  {
    "model": "Eicher Pro 2049",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "2.0L",
    "mileage": 11.5,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.233
  },
  {
    "model": "Tata 1512 LPT",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "3.3L NG",
    "mileage": 6.5,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.4123
  },
  {
    "model": "Ashok Leyland Ecomet 1615",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "3.8L",
    "mileage": 5.5,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.4872
  },
  {
    "model": "Tata Prima 5530.S (Trailer)",
    "category": "Truck",
    "fuel": "Diesel",
    "engine": "6.7L Cummins",
    "mileage": 3.5,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.7657
  },
  {
    "model": "Tata Winger Staff",
    "category": "Bus",
    "fuel": "Diesel",
    "engine": "2.2L",
    "mileage": 10.71,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.2502
  },
  {
    "model": "Force Traveller 26",
    "category": "Bus",
    "fuel": "Diesel",
    "engine": "2.6L",
    "mileage": 11.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.2436
  },
  {
    "model": "Tata Starbus City",
    "category": "Bus",
    "fuel": "CNG",
    "engine": "3.8L",
    "mileage": 4.5,
    "mileage_unit": "km/kg",
    "co2_factor": 2.75,
    "co2_per_km": 0.6111
  },
  {
    "model": "Ashok Leyland Viking",
    "category": "Bus",
    "fuel": "Diesel",
    "engine": "5.7L H-Series",
    "mileage": 4.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.67
  },
  {
    "model": "Volvo 9400 Intercity Coach",
    "category": "Bus",
    "fuel": "Diesel",
    "engine": "8.0L",
    "mileage": 3.0,
    "mileage_unit": "kmpl",
    "co2_factor": 2.68,
    "co2_per_km": 0.8933
  },
  {
    "model": "Olectra K9 Electric Bus",
    "category": "Bus",
    "fuel": "Electric",
    "engine": "300 kWh Battery",
    "mileage": 1.1,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.7454
  },
  {
    "model": "Tata Ultra Electric Bus",
    "category": "Bus",
    "fuel": "Electric",
    "engine": "250 kWh Battery",
    "mileage": 1.2,
    "mileage_unit": "km/kWh",
    "co2_factor": 0.82,
    "co2_per_km": 0.6833
  }
];

// Seed function
async function seedVehicles() {
  try {
    // Connect to MongoDB using the same connection logic as the server
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if vehicles already exist
    const count = await Vehicle.countDocuments();
    if (count > 0) {
      console.log(`⚠️  Database already contains ${count} vehicles.`);
      console.log('Skipping seed to prevent duplicates.');
      console.log('To re-seed, manually delete the vehicles collection first.');
      process.exit(0);
    }

    // Insert vehicles
    const result = await Vehicle.insertMany(vehiclesData);
    console.log(`✅ Successfully seeded ${result.length} vehicles!`);

    // Show summary by category
    const categories = await Vehicle.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Vehicles by Category:');
    categories.forEach(cat => {
      console.log(`  - ${cat._id}: ${cat.count} vehicles`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
    process.exit(1);
  }
}

// Run seed
seedVehicles();
