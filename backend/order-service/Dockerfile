FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

RUN apt-get update && apt-get install -y maven --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY pom.xml ./
COPY backend/api-gateway/pom.xml             backend/api-gateway/
COPY backend/auth-service/pom.xml            backend/auth-service/
COPY backend/user-role-service/pom.xml       backend/user-role-service/
COPY backend/order-service/pom.xml           backend/order-service/
COPY backend/planning-service/pom.xml        backend/planning-service/
COPY backend/time-service/pom.xml            backend/time-service/
COPY backend/absence-vacation-service/pom.xml backend/absence-vacation-service/
COPY backend/billing-service/pom.xml         backend/billing-service/
COPY backend/report-media-service/pom.xml    backend/report-media-service/

RUN mvn -pl backend/order-service -am dependency:go-offline -q

COPY backend/order-service/src backend/order-service/src
RUN mvn -pl backend/order-service -am package -DskipTests -q

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/backend/order-service/target/*.jar app.jar
EXPOSE 8003
ENTRYPOINT ["java", "-jar", "app.jar"]
