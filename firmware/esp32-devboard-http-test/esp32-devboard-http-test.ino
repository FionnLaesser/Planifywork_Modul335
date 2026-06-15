#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

// MVP-only WiFi test.
// Flow: Android HCE -> Flipper NFC reader -> UART -> WiFi Devboard -> HTTP backend.
// This does not use real secrets and does not verify a real Flipper Zero.
// The real version should call /api/flipper-auth/verify-device with HMAC and nonce protection.

const char *WIFI_SSID = "Noo Hotspoooot";
const char *WIFI_PASSWORD = "12345678";
const char *BACKEND_BASE_URL = "http://10.184.176.145:8000";
const char *USERNAME = "emp.meier";
const char *FIRMWARE_VERSION = "planifywork-esp32-2026-06-15-2";

// Keep this false for the real phone -> Flipper -> Devboard test.
// If true, the Devboard can trigger auth without receiving anything from the Flipper.
const bool ENABLE_LATEST_PENDING_FALLBACK = false;
const unsigned long POLL_INTERVAL_MS = 10000;
const unsigned long FLIPPER_UART_BAUD_RATE = 115200;
// Official Flipper WiFi Devboard / ESP32-S2 UART0 pins.
// RX receives SESSION_ID:<id> from the Flipper TXD0 pin.
const int FLIPPER_UART_RX_PIN = 44;
const int FLIPPER_UART_TX_PIN = 43;
const char *SESSION_ID_PREFIX = "SESSION_ID:";

unsigned long lastPollAt = 0;
size_t sessionPrefixIndex = 0;
bool readingSessionId = false;
String sessionIdBuffer;

void setup()
{
  Serial.begin(115200);
  delay(500);
  Serial.print("Firmware: ");
  Serial.println(FIRMWARE_VERSION);
  Serial.print("Backend: ");
  Serial.println(BACKEND_BASE_URL);

  Serial1.begin(
      FLIPPER_UART_BAUD_RATE,
      SERIAL_8N1,
      FLIPPER_UART_RX_PIN,
      FLIPPER_UART_TX_PIN);
  Serial.println("Flipper UART ready, waiting for SESSION_ID:<id>");

  connectWiFi();
}

void loop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    connectWiFi();
  }

  processFlipperUart();

  if (!ENABLE_LATEST_PENDING_FALLBACK)
  {
    return;
  }

  unsigned long now = millis();
  if (now - lastPollAt >= POLL_INTERVAL_MS || lastPollAt == 0)
  {
    lastPollAt = now;
    runAuthTest();
  }
}

void processFlipperUart()
{
  while (Serial1.available() > 0)
  {
    char value = static_cast<char>(Serial1.read());

    if (readingSessionId)
    {
      if (isJsonDigit(value))
      {
        if (sessionIdBuffer.length() < 20)
        {
          sessionIdBuffer += value;
        }
        else
        {
          Serial.println("Session ID too long, resetting UART parser");
          readingSessionId = false;
          sessionIdBuffer = "";
        }
        continue;
      }

      if (sessionIdBuffer.length() > 0)
      {
        handleFlipperSessionId(sessionIdBuffer);
      }

      readingSessionId = false;
      sessionIdBuffer = "";
      continue;
    }

    if (value == SESSION_ID_PREFIX[sessionPrefixIndex])
    {
      sessionPrefixIndex++;
      if (SESSION_ID_PREFIX[sessionPrefixIndex] == '\0')
      {
        sessionPrefixIndex = 0;
        readingSessionId = true;
        sessionIdBuffer = "";
      }
    }
    else
    {
      sessionPrefixIndex = value == SESSION_ID_PREFIX[0] ? 1 : 0;
    }
  }
}

void handleFlipperSessionId(String sessionIdText)
{
  sessionIdText.trim();

  if (!isPositiveNumber(sessionIdText))
  {
    Serial.print("Invalid sessionId from UART: ");
    Serial.println(sessionIdText);
    return;
  }

  long sessionId = sessionIdText.toInt();
  Serial.print("Extracted sessionId: ");
  Serial.println(sessionId);

  String simulateResponse;
  int postStatus = simulateDevice(sessionId, simulateResponse);

  Serial.print("HTTP Status: ");
  Serial.println(postStatus);
  Serial.print("Backend Response: ");
  Serial.println(simulateResponse);

  lastPollAt = millis();
}

void connectWiFi()
{
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi connected, IP: ");
  Serial.println(WiFi.localIP());
}

void runAuthTest()
{
  String pendingResponse;
  int getStatus = getLatestPending(pendingResponse);

  Serial.print("latest-pending HTTP status: ");
  Serial.println(getStatus);
  Serial.print("latest-pending response: ");
  Serial.println(pendingResponse);

  if (getStatus != 200)
  {
    return;
  }

  long sessionId = extractSessionId(pendingResponse);
  if (sessionId <= 0)
  {
    Serial.println("Could not extract sessionId from response");
    return;
  }

  Serial.print("Using sessionId: ");
  Serial.println(sessionId);

  String simulateResponse;
  int postStatus = simulateDevice(sessionId, simulateResponse);

  Serial.print("simulate-device HTTP status: ");
  Serial.println(postStatus);
  Serial.print("simulate-device response: ");
  Serial.println(simulateResponse);
}

int getLatestPending(String &responseBody)
{
  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + "/api/flipper-auth/latest-pending?username=" + USERNAME;

  Serial.print("GET ");
  Serial.println(url);

  http.begin(url);
  int statusCode = http.GET();
  responseBody = http.getString();
  http.end();

  return statusCode;
}

int simulateDevice(long sessionId, String &responseBody)
{
  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + "/api/flipper-auth/simulate-device";
  String body = "{\"sessionId\":" + String(sessionId) + "}";

  Serial.print("POST ");
  Serial.println(url);
  Serial.print("Body: ");
  Serial.println(body);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int statusCode = http.POST(body);
  responseBody = http.getString();
  http.end();

  return statusCode;
}

long extractSessionId(const String &json)
{
  int keyIndex = json.indexOf("\"sessionId\"");
  if (keyIndex < 0)
  {
    return -1;
  }

  int colonIndex = json.indexOf(':', keyIndex);
  if (colonIndex < 0)
  {
    return -1;
  }

  int valueStart = colonIndex + 1;
  while (valueStart < json.length() && isJsonWhitespace(json.charAt(valueStart)))
  {
    valueStart++;
  }

  int valueEnd = valueStart;
  while (valueEnd < json.length() && isJsonDigit(json.charAt(valueEnd)))
  {
    valueEnd++;
  }

  if (valueEnd <= valueStart)
  {
    return -1;
  }

  return json.substring(valueStart, valueEnd).toInt();
}

bool isJsonWhitespace(char value)
{
  return value == ' ' || value == '\n' || value == '\r' || value == '\t';
}

bool isJsonDigit(char value)
{
  return value >= '0' && value <= '9';
}

bool isPositiveNumber(const String &value)
{
  if (value.length() == 0)
  {
    return false;
  }

  for (int index = 0; index < value.length(); index++)
  {
    if (!isJsonDigit(value.charAt(index)))
    {
      return false;
    }
  }

  return value.toInt() > 0;
}
