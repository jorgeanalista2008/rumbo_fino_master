class DriverProfileModel {
  final String id;
  final String userId;
  final String licenseNumber;
  final String licenseCategory;
  final double rating;
  final int totalTrips;
  final bool isOnline;
  final String? currentLocation;
  final AssignedVehicleModel? vehicle;
  final DriverUserModel user;

  DriverProfileModel({
    required this.id,
    required this.userId,
    required this.licenseNumber,
    required this.licenseCategory,
    required this.rating,
    required this.totalTrips,
    required this.isOnline,
    this.currentLocation,
    this.vehicle,
    required this.user,
  });

  factory DriverProfileModel.fromJson(Map<String, dynamic> json) {
    double parsedRating = 5.0;
    if (json['rating'] != null) {
      parsedRating = (json['rating'] is num)
          ? (json['rating'] as num).toDouble()
          : (double.tryParse(json['rating'].toString()) ?? 5.0);
    } else if (json['ratingAvg'] != null) {
      parsedRating = (json['ratingAvg'] is num)
          ? (json['ratingAvg'] as num).toDouble()
          : (double.tryParse(json['ratingAvg'].toString()) ?? 5.0);
    }

    final vehicleJson = json['currentVehicle'] ?? json['assignedVehicle'] ?? json['vehicle'];

    return DriverProfileModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      licenseNumber: json['licenseNumber'] ?? '',
      licenseCategory: json['licenseCategory'] ?? 'Quinta',
      rating: parsedRating,
      totalTrips: json['totalRides'] ?? json['totalTrips'] ?? 0,
      isOnline: json['isOnline'] ?? false,
      currentLocation: json['currentLocation'],
      vehicle: vehicleJson != null ? AssignedVehicleModel.fromJson(vehicleJson) : null,
      user: json['user'] != null
          ? DriverUserModel.fromJson(json['user'])
          : DriverUserModel(
              id: json['userId'] ?? '',
              firstName: 'Chofer',
              lastName: 'Ejecutivo',
              email: '',
              role: 'DRIVER',
            ),
    );
  }
}

class DriverUserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String role;
  final String? phoneNumber;
  final String? avatarUrl;

  DriverUserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    this.phoneNumber,
    this.avatarUrl,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory DriverUserModel.fromJson(Map<String, dynamic> json) {
    return DriverUserModel(
      id: json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'DRIVER',
      phoneNumber: json['phoneNumber'],
      avatarUrl: json['avatarUrl'],
    );
  }
}

class AssignedVehicleModel {
  final String id;
  final String plateNumber;
  final String brand;
  final String model;
  final String color;
  final String tier;
  final String? photoUrl;

  AssignedVehicleModel({
    required this.id,
    required this.plateNumber,
    required this.brand,
    required this.model,
    required this.color,
    required this.tier,
    this.photoUrl,
  });

  String get displayName => '$brand $model ($plateNumber)'.toUpperCase();

  factory AssignedVehicleModel.fromJson(Map<String, dynamic> json) {
    return AssignedVehicleModel(
      id: json['id'] ?? '',
      plateNumber: json['licensePlate'] ?? json['plateNumber'] ?? '',
      brand: json['make'] ?? json['brand'] ?? 'Toyota',
      model: json['model'] ?? 'Executive',
      color: json['color'] ?? 'Negro',
      tier: json['category'] ?? json['tier'] ?? 'BLACK',
      photoUrl: (json['photos'] is List && (json['photos'] as List).isNotEmpty)
          ? (json['photos'] as List).first
          : json['photoUrl'],
    );
  }
}
