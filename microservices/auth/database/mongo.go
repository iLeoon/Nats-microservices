package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoInstance struct {
	Client *mongo.Client
	Db     *mongo.Database
}

func Connect() (*MongoInstance, error) {

	if err := godotenv.Load(".env"); err != nil {
		log.Fatal("Can't reload env variables")
	}
	mongo_uri := os.Getenv("MONGO_URI")

	client, err := mongo.Connect(context.TODO(), options.Client().
		ApplyURI(mongo_uri))

	if err != nil {
		log.Fatal("Can't connect to mongo database")
	}

	fmt.Println("Connected to the database successfully")

	db := client.Database("go-test")

	mg := &MongoInstance{
		Client: client,
		Db:     db,
	}

	return mg, nil

}
