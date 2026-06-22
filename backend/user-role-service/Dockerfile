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
COPY backend/flipper-auth-service/pom.xml    backend/flipper-auth-service/

RUN mvn -pl backend/user-role-service -am dependency:go-offline -q

COPY backend/user-role-service/src backend/user-role-service/src
RUN mvn -pl backend/user-role-service -am package -DskipTests -q

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/backend/user-role-service/target/*.jar app.jar
EXPOSE 8002
ENTRYPOINT ["java", "-jar", "app.jar"]
