enum DriverRideStatus {
  SOLICITADO,
  ASIGNADO,
  EN_CAMINO,
  ABORDAJE,
  EN_CURSO,
  FINALIZADO,
  CANCELADO,
}

DriverRideStatus parseDriverRideStatus(String? status) {
  switch (status?.toUpperCase()) {
    case 'SOLICITADO':
      return DriverRideStatus.SOLICITADO;
    case 'ASIGNADO':
      return DriverRideStatus.ASIGNADO;
    case 'EN_CAMINO':
      return DriverRideStatus.EN_CAMINO;
    case 'ABORDAJE':
      return DriverRideStatus.ABORDAJE;
    case 'EN_CURSO':
      return DriverRideStatus.EN_CURSO;
    case 'FINALIZADO':
      return DriverRideStatus.FINALIZADO;
    case 'CANCELADO':
      return DriverRideStatus.CANCELADO;
    default:
      return DriverRideStatus.SOLICITADO;
  }
}

class DriverRideModel {
  final String id;
  final String? rideCode;
  final String passengerId;
  final String passengerName;
  final String? passengerPhone;
  final String? passengerAvatar;
  final String pickupAddress;
  final String dropoffAddress;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;
  final double fareAmountUsd;
  final double fareAmountVes;
  final double bcvRate;
  final String requestedTier;
  final DriverRideStatus status;
  final DateTime createdAt;

  DriverRideModel({
    required this.id,
    this.rideCode,
    required this.passengerId,
    required this.passengerName,
    this.passengerPhone,
    this.passengerAvatar,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffLat,
    required this.dropoffLng,
    required this.fareAmountUsd,
    required this.fareAmountVes,
    required this.bcvRate,
    required this.requestedTier,
    required this.status,
    required this.createdAt,
  });

  factory DriverRideModel.fromJson(Map<String, dynamic> json) {
    final passengerData = json['passenger'];
    String name = 'Pasajero VIP';
    String? phone;
    String? avatar;

    if (passengerData != null && passengerData is Map<String, dynamic>) {
      final pFirst = passengerData['firstName'] ?? '';
      final pLast = passengerData['lastName'] ?? '';
      name = '$pFirst $pLast'.trim();
      if (name.isEmpty) name = passengerData['email'] ?? 'Pasajero VIP';
      phone = passengerData['phoneNumber'];
      avatar = passengerData['avatarUrl'];
    }

    return DriverRideModel(
      id: json['id'] ?? '',
      rideCode: json['rideCode'] ?? json['id']?.toString().substring(0, 8).toUpperCase(),
      passengerId: json['passengerId'] ?? '',
      passengerName: name,
      passengerPhone: phone,
      passengerAvatar: avatar,
      pickupAddress: json['pickupAddress'] ?? 'Origen Ejecutivo',
      dropoffAddress: json['dropoffAddress'] ?? 'Destino Ejecutivo',
      pickupLat: (json['pickupLatitude'] != null)
          ? (json['pickupLatitude'] as num).toDouble()
          : (json['pickupLat'] != null ? (json['pickupLat'] as num).toDouble() : 10.4806),
      pickupLng: (json['pickupLongitude'] != null)
          ? (json['pickupLongitude'] as num).toDouble()
          : (json['pickupLng'] != null ? (json['pickupLng'] as num).toDouble() : -66.9036),
      dropoffLat: (json['dropoffLatitude'] != null)
          ? (json['dropoffLatitude'] as num).toDouble()
          : (json['dropoffLat'] != null ? (json['dropoffLat'] as num).toDouble() : 10.4900),
      dropoffLng: (json['dropoffLongitude'] != null)
          ? (json['dropoffLongitude'] as num).toDouble()
          : (json['dropoffLng'] != null ? (json['dropoffLng'] as num).toDouble() : -66.8600),
      fareAmountUsd: (json['fareAmountUsd'] != null)
          ? (json['fareAmountUsd'] as num).toDouble()
          : (json['fare'] != null ? (json['fare'] as num).toDouble() : 15.0),
      fareAmountVes: (json['fareAmountVes'] != null)
          ? (json['fareAmountVes'] as num).toDouble()
          : 0.0,
      bcvRate: (json['bcvRate'] != null) ? (json['bcvRate'] as num).toDouble() : 36.50,
      requestedTier: json['requestedTier'] ?? 'BLACK',
      status: parseDriverRideStatus(json['status']),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
