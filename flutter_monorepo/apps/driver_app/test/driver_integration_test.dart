import 'package:flutter_test/flutter_test.dart';
import 'package:driver_app/models/driver_model.dart';
import 'package:driver_app/models/driver_ride_model.dart';

void main() {
  group('Driver App Core Verification Tests', () {
    test('1. Validates Driver Model parsing from Live Vercel Backend JSON', () {
      final backendJson = {
        "id": "c8fcce6b-c40f-44d3-8d88-7958d131f284",
        "userId": "18633a55-3440-499f-b342-e4240aedf7d0",
        "licenseNumber": "LIC-5TA-0019283",
        "licenseCategory": "Quinto Grado Profesional",
        "ratingAvg": "4.98",
        "totalRides": 234,
        "isOnline": true,
        "user": {
          "id": "18633a55-3440-499f-b342-e4240aedf7d0",
          "email": "chofer1@rumbofino.com",
          "phoneNumber": "+58 412 1110001",
          "firstName": "Carlos",
          "lastName": "Mendoza",
          "role": "DRIVER",
        },
        "currentVehicle": {
          "id": "db71dc09-5638-46e5-a93b-e1d85ad1f3de",
          "make": "Mercedes-Benz",
          "model": "E-Class 350 AMG Line",
          "color": "Negro Obsidian Metalizado",
          "licensePlate": "VIP-777",
          "category": "EXECUTIVE_SEDAN"
        }
      };

      final profile = DriverProfileModel.fromJson(backendJson);

      expect(profile.user.fullName, 'Carlos Mendoza');
      expect(profile.user.email, 'chofer1@rumbofino.com');
      expect(profile.user.role, 'DRIVER');
      expect(profile.rating, 4.98);
      expect(profile.totalTrips, 234);
      expect(profile.isOnline, true);
      expect(profile.licenseNumber, 'LIC-5TA-0019283');
      expect(profile.vehicle, isNotNull);
      expect(profile.vehicle!.displayName, 'MERCEDES-BENZ E-CLASS 350 AMG LINE (VIP-777)');
      expect(profile.vehicle!.color, 'Negro Obsidian Metalizado');
    });

    test('2. Validates Driver Ride Dispatch Model with Dual Currency Pricing', () {
      final rideJson = {
        "id": "ride_998877",
        "rideCode": "RF-VIP-101",
        "passengerId": "pass_1",
        "passenger": {
          "firstName": "Valentina",
          "lastName": "Mendoza",
          "phoneNumber": "+58 414 888 9900"
        },
        "pickupAddress": "Hotel JW Marriott, Caracas",
        "dropoffAddress": "Torre Digitel, La Castellana",
        "pickupLatitude": 10.4890,
        "pickupLongitude": -66.8650,
        "dropoffLatitude": 10.4990,
        "dropoffLongitude": -66.8520,
        "fareAmountUsd": 25.0,
        "fareAmountVes": 1637.5,
        "bcvRate": 65.5,
        "requestedTier": "BLACK",
        "status": "SOLICITADO",
        "createdAt": "2026-09-27T23:00:00.000Z"
      };

      final ride = DriverRideModel.fromJson(rideJson);

      expect(ride.rideCode, 'RF-VIP-101');
      expect(ride.passengerName, 'Valentina Mendoza');
      expect(ride.pickupAddress, 'Hotel JW Marriott, Caracas');
      expect(ride.dropoffAddress, 'Torre Digitel, La Castellana');
      expect(ride.fareAmountUsd, 25.0);
      expect(ride.fareAmountVes, 1637.5);
      expect(ride.bcvRate, 65.5);
      expect(ride.status, DriverRideStatus.SOLICITADO);
    });

    test('3. Validates Driver Ride State Transition Lifecycle', () {
      expect(parseDriverRideStatus('ASIGNADO'), DriverRideStatus.ASIGNADO);
      expect(parseDriverRideStatus('EN_CAMINO'), DriverRideStatus.EN_CAMINO);
      expect(parseDriverRideStatus('ABORDAJE'), DriverRideStatus.ABORDAJE);
      expect(parseDriverRideStatus('EN_CURSO'), DriverRideStatus.EN_CURSO);
      expect(parseDriverRideStatus('FINALIZADO'), DriverRideStatus.FINALIZADO);
      expect(parseDriverRideStatus('CANCELADO'), DriverRideStatus.CANCELADO);
    });
  });
}
