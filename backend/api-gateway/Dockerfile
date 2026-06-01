FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

RUN apt-get update && apt-get install -y maven --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Alle pom.xml zuerst kopieren -> Docker-Layer-Caching fuer Dependencies
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

RUN mvn -pl backend/api-gateway -am dependency:go-offline -q

COPY backend/api-gateway/src backend/api-gateway/src
RUN mvn -pl backend/api-gateway -am package -DskipTests -q

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/backend/api-gateway/target/*.jar app.jar
EXPOSE 8000
ENTRYPOINT ["java", "-jar", "app.jar"]
