import 'package:flutter_test/flutter_test.dart';
import 'package:driver_app/main.dart';

void main() {
  testWidgets('Driver app bootstrap smoke test', (WidgetTester tester) async {
    expect(RumboFinoDriverApp.new, isNotNull);
  });
}
