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
    return DriverProfileModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      licenseNumber: json['licenseNumber'] ?? '',
      licenseCategory: json['licenseCategory'] ?? 'Quinta',
      rating: (json['rating'] != null) ? (json['rating'] as num).toDouble() : 5.0,
      totalTrips: json['totalTrips'] ?? 0,
      isOnline: json['isOnline'] ?? false,
      currentLocation: json['currentLocation'],
      vehicle: json['assignedVehicle'] != null
          ? AssignedVehicleModel.fromJson(json['assignedVehicle'])
          : (json['vehicle'] != null ? AssignedVehicleModel.fromJson(json['vehicle']) : null),
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
      plateNumber: json['plateNumber'] ?? '',
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      color: json['color'] ?? '',
      tier: json['tier'] ?? 'BLACK',
      photoUrl: json['photoUrl'],
    );
  }
}
