class RideModel {
  final String id;
  final String passengerId;
  final String? driverId;
  final String status;
  final String originAddress;
  final double originLatitude;
  final double originLongitude;
  final String destinationAddress;
  final double destinationLatitude;
  final double destinationLongitude;
  final double totalFareUsd;
  final double? finalFareUsd;
  final double bcvRate;
  final String category;
  final String paymentMethod;
  final double distanceKm;
  final int estimatedDurationMin;
  
  // Real Driver and Vehicle details
  final String? driverName;
  final String? driverPhone;
  final String? driverAvatar;
  final double driverRating;
  final String? vehicleMake;
  final String? vehicleModel;
  final String? vehiclePlate;
  final String? vehicleColor;

  // Realtime Live Driver GPS
  final double? driverLatitude;
  final double? driverLongitude;
  final double? driverHeading;
  final double? driverSpeed;

  final DateTime createdAt;

  RideModel({
    required this.id,
    required this.passengerId,
    this.driverId,
    required this.status,
    required this.originAddress,
    required this.originLatitude,
    required this.originLongitude,
    required this.destinationAddress,
    required this.destinationLatitude,
    required this.destinationLongitude,
    required this.totalFareUsd,
    this.finalFareUsd,
    this.bcvRate = 875.0,
    required this.category,
    this.paymentMethod = 'PAGO_MOVIL',
    this.distanceKm = 0.0,
    this.estimatedDurationMin = 10,
    this.driverName,
    this.driverPhone,
    this.driverAvatar,
    this.driverRating = 5.0,
    this.vehicleMake,
    this.vehicleModel,
    this.vehiclePlate,
    this.vehicleColor,
    this.driverLatitude,
    this.driverLongitude,
    this.driverHeading,
    this.driverSpeed,
    required this.createdAt,
  });

  double get totalFareVes => totalFareUsd * bcvRate;
  double get displayFareUsd => finalFareUsd ?? totalFareUsd;
  double get displayFareVes => displayFareUsd * bcvRate;

  String get fullVehicleDescription {
    final parts = [
      vehicleMake,
      vehicleModel,
      if (vehicleColor != null && vehicleColor!.isNotEmpty) '($vehicleColor)'
    ].where((e) => e != null && e.isNotEmpty).toList();
    return parts.isNotEmpty ? parts.join(' ') : 'Vehículo Ejecutivo Asignado';
  }

  RideModel copyWith({
    String? status,
    String? driverId,
    String? driverName,
    String? driverPhone,
    String? driverAvatar,
    double? driverRating,
    String? vehicleMake,
    String? vehicleModel,
    String? vehiclePlate,
    String? vehicleColor,
    double? driverLatitude,
    double? driverLongitude,
    double? driverHeading,
    double? driverSpeed,
    double? bcvRate,
    double? finalFareUsd,
  }) {
    return RideModel(
      id: id,
      passengerId: passengerId,
      driverId: driverId ?? this.driverId,
      status: status ?? this.status,
      originAddress: originAddress,
      originLatitude: originLatitude,
      originLongitude: originLongitude,
      destinationAddress: destinationAddress,
      destinationLatitude: destinationLatitude,
      destinationLongitude: destinationLongitude,
      totalFareUsd: totalFareUsd,
      finalFareUsd: finalFareUsd ?? this.finalFareUsd,
      bcvRate: bcvRate ?? this.bcvRate,
      category: category,
      paymentMethod: paymentMethod,
      distanceKm: distanceKm,
      estimatedDurationMin: estimatedDurationMin,
      driverName: driverName ?? this.driverName,
      driverPhone: driverPhone ?? this.driverPhone,
      driverAvatar: driverAvatar ?? this.driverAvatar,
      driverRating: driverRating ?? this.driverRating,
      vehicleMake: vehicleMake ?? this.vehicleMake,
      vehicleModel: vehicleModel ?? this.vehicleModel,
      vehiclePlate: vehiclePlate ?? this.vehiclePlate,
      vehicleColor: vehicleColor ?? this.vehicleColor,
      driverLatitude: driverLatitude ?? this.driverLatitude,
      driverLongitude: driverLongitude ?? this.driverLongitude,
      driverHeading: driverHeading ?? this.driverHeading,
      driverSpeed: driverSpeed ?? this.driverSpeed,
      createdAt: createdAt,
    );
  }

  static double _parseDouble(dynamic val, [double defaultVal = 0.0]) {
    if (val == null) return defaultVal;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString()) ?? defaultVal;
  }

  static int _parseInt(dynamic val, [int defaultVal = 0]) {
    if (val == null) return defaultVal;
    if (val is int) return val;
    if (val is num) return val.toInt();
    return int.tryParse(val.toString()) ?? defaultVal;
  }

  factory RideModel.fromJson(Map<String, dynamic> json) {
    // Extract driver details
    String? dName;
    String? dPhone;
    String? dAvatar;
    double dRating = 5.0;

    final driverObj = json['driver'];
    if (driverObj is Map<String, dynamic>) {
      final userObj = driverObj['user'];
      if (userObj is Map<String, dynamic>) {
        final fName = userObj['firstName'] ?? '';
        final lName = userObj['lastName'] ?? '';
        dName = '$fName $lName'.trim();
        dPhone = userObj['phoneNumber'] ?? userObj['phone'];
        dAvatar = userObj['avatarUrl'];
      }
      if (driverObj['rating'] != null) {
        dRating = _parseDouble(driverObj['rating'], 5.0);
      }
    }
    dName = dName ?? json['driverName'];
    dPhone = dPhone ?? json['driverPhone'];

    // Extract vehicle details
    String? vMake;
    String? vModel;
    String? vPlate;
    String? vColor;

    final vehicleObj = json['vehicle'] ?? driverObj?['currentVehicle'];
    if (vehicleObj is Map<String, dynamic>) {
      vMake = vehicleObj['make'] ?? vehicleObj['brand'];
      vModel = vehicleObj['model'];
      vPlate = vehicleObj['licensePlate'] ?? vehicleObj['plateNumber'] ?? vehicleObj['plate'];
      vColor = vehicleObj['color'];
    }
    vModel = vModel ?? json['vehicleModel'];
    vPlate = vPlate ?? json['vehiclePlate'];
    vColor = vColor ?? json['vehicleColor'];

    return RideModel(
      id: json['id']?.toString() ?? '',
      passengerId: json['passengerId']?.toString() ?? '',
      driverId: json['driverId']?.toString(),
      status: (json['status'] ?? 'SOLICITADO').toString().toUpperCase(),
      originAddress: json['originAddress']?.toString() ?? 'Ubicación de Origen',
      originLatitude: _parseDouble(json['originLat'] ?? json['originLatitude'], 10.4900),
      originLongitude: _parseDouble(json['originLng'] ?? json['originLongitude'], -66.8600),
      destinationAddress: json['destinationAddress']?.toString() ?? 'Destino Ejecutivo',
      destinationLatitude: _parseDouble(json['destinationLat'] ?? json['destinationLatitude'], 10.4950),
      destinationLongitude: _parseDouble(json['destinationLng'] ?? json['destinationLongitude'], -66.8500),
      totalFareUsd: _parseDouble(json['totalFare'] ?? json['estimatedFareUsd'], 15.0),
      finalFareUsd: json['finalFareUsd'] != null ? _parseDouble(json['finalFareUsd']) : null,
      bcvRate: _parseDouble(json['bcvRate'] ?? json['exchangeRateBcv'], 875.0),
      category: json['categoryRequested']?.toString() ?? json['category']?.toString() ?? 'EXECUTIVE_SEDAN',
      paymentMethod: json['paymentMethod']?.toString() ?? 'PAGO_MOVIL',
      distanceKm: _parseDouble(json['distanceKm'], 0.0),
      estimatedDurationMin: _parseInt(json['estimatedDurationMin'], 10),
      driverName: dName,
      driverPhone: dPhone,
      driverAvatar: dAvatar,
      driverRating: dRating,
      vehicleMake: vMake,
      vehicleModel: vModel,
      vehiclePlate: vPlate,
      vehicleColor: vColor,
      driverLatitude: json['driverLatitude'] != null ? _parseDouble(json['driverLatitude']) : null,
      driverLongitude: json['driverLongitude'] != null ? _parseDouble(json['driverLongitude']) : null,
      driverHeading: json['driverHeading'] != null ? _parseDouble(json['driverHeading']) : null,
      driverSpeed: json['driverSpeed'] != null ? _parseDouble(json['driverSpeed']) : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
