class DriverProfileModel {
  final String id;
  final String userId;
  final String licenseNumber;
  final String licenseCategory;
  final String? licenseExpiration;
  final double rating;
  final int totalTrips;
  final bool isOnline;
  final String? currentLocation;
  final AssignedVehicleModel? vehicle;
  final DriverUserModel user;
  final List<DriverReviewModel> reviews;
  final List<DriverDocumentModel> documents;
  final DriverBalanceModel? balance;

  DriverProfileModel({
    required this.id,
    required this.userId,
    required this.licenseNumber,
    required this.licenseCategory,
    this.licenseExpiration,
    required this.rating,
    required this.totalTrips,
    required this.isOnline,
    this.currentLocation,
    this.vehicle,
    required this.user,
    this.reviews = const [],
    this.documents = const [],
    this.balance,
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

    List<DriverReviewModel> parsedReviews = [];
    if (json['reviews'] is List) {
      parsedReviews = (json['reviews'] as List)
          .map((r) => DriverReviewModel.fromJson(r))
          .toList();
    }

    List<DriverDocumentModel> parsedDocs = [];
    if (json['documents'] is List) {
      parsedDocs = (json['documents'] as List)
          .map((d) => DriverDocumentModel.fromJson(d))
          .toList();
    }

    return DriverProfileModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      licenseNumber: json['licenseNumber'] ?? '',
      licenseCategory: json['licenseCategory'] ?? 'Quinta Profesional',
      licenseExpiration: json['licenseExpiration']?.toString() ?? '2028-12-31',
      rating: parsedRating,
      totalTrips: json['totalRides'] ?? json['totalTrips'] ?? 0,
      isOnline: json['isOnline'] ?? false,
      currentLocation: json['currentLocation'],
      vehicle: vehicleJson != null ? AssignedVehicleModel.fromJson(vehicleJson) : null,
      reviews: parsedReviews,
      documents: parsedDocs,
      balance: json['balance'] != null ? DriverBalanceModel.fromJson(json['balance']) : null,
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

class DriverDocumentModel {
  final String id;
  final String documentType;
  final String documentNumber;
  final String? fileUrl;
  final String status;
  final String? expirationDate;

  DriverDocumentModel({
    required this.id,
    required this.documentType,
    required this.documentNumber,
    this.fileUrl,
    required this.status,
    this.expirationDate,
  });

  factory DriverDocumentModel.fromJson(Map<String, dynamic> json) {
    return DriverDocumentModel(
      id: json['id'] ?? '',
      documentType: json['documentType'] ?? 'DOCUMENTO',
      documentNumber: json['documentNumber'] ?? '',
      fileUrl: json['fileUrl'],
      status: json['status'] ?? 'PENDING',
      expirationDate: json['expirationDate']?.toString(),
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
  final int year;
  final String color;
  final String tier;
  final String status;
  final int currentOdometer;
  final String transmission;
  final String fuelType;
  final List<String> photos;
  final List<String> amenities;

  AssignedVehicleModel({
    required this.id,
    required this.plateNumber,
    required this.brand,
    required this.model,
    this.year = 2024,
    required this.color,
    required this.tier,
    this.status = 'EN SERVICIO',
    this.currentOdometer = 15420,
    this.transmission = 'Automática',
    this.fuelType = 'Gasolina Premium',
    this.photos = const [],
    this.amenities = const [],
  });

  String get displayName => '$brand $model ($plateNumber)'.toUpperCase();
  String? get photoUrl => photos.isNotEmpty ? photos.first : null;

  factory AssignedVehicleModel.fromJson(Map<String, dynamic> json) {
    List<String> photoList = [];
    if (json['photos'] is List) {
      photoList = (json['photos'] as List).map((p) => p.toString()).toList();
    } else if (json['photoUrl'] != null && json['photoUrl'].toString().isNotEmpty) {
      photoList = [json['photoUrl'].toString()];
    }

    List<String> amenityList = [];
    if (json['amenities'] is List) {
      amenityList = (json['amenities'] as List).map((a) => a.toString()).toList();
    }

    return AssignedVehicleModel(
      id: json['id'] ?? '',
      plateNumber: json['licensePlate'] ?? json['plateNumber'] ?? 'AB123CD',
      brand: json['make'] ?? json['brand'] ?? 'Toyota',
      model: json['model'] ?? 'Fortuner Executive',
      year: json['year'] != null ? int.tryParse(json['year'].toString()) ?? 2024 : 2024,
      color: json['color'] ?? 'Negro Obsidian Metalizado',
      tier: json['category'] ?? json['tier'] ?? 'BLACK TIER',
      status: json['status'] ?? 'EN SERVICIO',
      currentOdometer: json['currentOdometer'] != null
          ? int.tryParse(json['currentOdometer'].toString()) ?? 15420
          : 15420,
      transmission: json['transmission'] ?? 'Automática Secuencial',
      fuelType: json['fuelType'] ?? 'Gasolina Premium',
      photos: photoList.isNotEmpty
          ? photoList
          : ['https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800'],
      amenities: amenityList.isNotEmpty
          ? amenityList
          : ['Wi-Fi 5G', 'Asientos de Cuero', 'Climatizador Tri-Zona', 'Agua de Cortesía'],
    );
  }
}

class DriverReviewModel {
  final String id;
  final String passengerName;
  final String? passengerAvatar;
  final double rating;
  final String comment;
  final String date;
  final int cleanlinessRating;
  final int punctualityRating;
  final int comfortRating;

  DriverReviewModel({
    required this.id,
    required this.passengerName,
    this.passengerAvatar,
    required this.rating,
    required this.comment,
    required this.date,
    this.cleanlinessRating = 5,
    this.punctualityRating = 5,
    this.comfortRating = 5,
  });

  factory DriverReviewModel.fromJson(Map<String, dynamic> json) {
    return DriverReviewModel(
      id: json['id'] ?? '',
      passengerName: json['passengerName'] ?? json['author']?['firstName'] ?? 'Pasajero VIP',
      passengerAvatar: json['passengerAvatar'] ?? json['author']?['avatarUrl'],
      rating: (json['rating'] is num)
          ? (json['rating'] as num).toDouble()
          : (double.tryParse(json['rating']?.toString() ?? '5.0') ?? 5.0),
      comment: json['comment'] ?? 'Excelente traslado y atención ejecutiva de primer nivel.',
      date: json['date'] ?? 'Reciente',
      cleanlinessRating: json['cleanlinessRating'] != null
          ? int.tryParse(json['cleanlinessRating'].toString()) ?? 5
          : 5,
      punctualityRating: json['punctualityRating'] != null
          ? int.tryParse(json['punctualityRating'].toString()) ?? 5
          : 5,
      comfortRating: json['comfortRating'] != null
          ? int.tryParse(json['comfortRating'].toString()) ?? 5
          : 5,
    );
  }
}

class DriverBalanceModel {
  final double currentBalance;
  final double pendingPayout;
  final double totalEarned;
  final double totalCommissionPaid;

  DriverBalanceModel({
    required this.currentBalance,
    required this.pendingPayout,
    required this.totalEarned,
    required this.totalCommissionPaid,
  });

  factory DriverBalanceModel.fromJson(Map<String, dynamic> json) {
    return DriverBalanceModel(
      currentBalance: (json['currentBalance'] is num) ? (json['currentBalance'] as num).toDouble() : 0.0,
      pendingPayout: (json['pendingPayout'] is num) ? (json['pendingPayout'] as num).toDouble() : 0.0,
      totalEarned: (json['totalEarned'] is num) ? (json['totalEarned'] as num).toDouble() : 0.0,
      totalCommissionPaid: (json['totalCommissionPaid'] is num) ? (json['totalCommissionPaid'] as num).toDouble() : 0.0,
    );
  }
}
