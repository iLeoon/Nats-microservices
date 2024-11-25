package repository

import (
	"context"
	"fmt"
	"iLeon/microservices/auth/database"
	"iLeon/microservices/auth/models"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type AuthRepository interface {
	Login(body models.LoginUserBody) *models.CustomeResponse
	Register(models.CreateUserBody) *models.CustomeResponse
}

type Repository struct {
	Mg *database.MongoInstance
}

func NewRepo(mg *database.MongoInstance) AuthRepository {

	return &Repository{
		Mg: mg,
	}
}

func (r *Repository) Login(body models.LoginUserBody) *models.CustomeResponse {

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	users := r.Mg.Db.Collection("users")
	query := bson.D{primitive.E{Key: "email", Value: body.Email}}

	user := users.FindOne(ctx, query)

	readUser := &models.CreateUserBody{}
	user.Decode(readUser)

	if readUser.Email == "" {
		return &models.CustomeResponse{
			Msg:     "Invalid user email or password",
			Context: false,
		}
	}

	err := bcrypt.CompareHashAndPassword([]byte(readUser.Password), []byte(body.Password))

	if err != nil {
		return &models.CustomeResponse{
			Msg:     "Invalid password",
			Context: false,
		}
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": body.Email,
		"exp": time.Now().Add(time.Hour * 24 * 30).Unix(),
	})

	// Sign and get the complete encoded token as a string using the secret

	tokenString, err := token.SignedString([]byte(os.Getenv("SECRET_KEY")))

	if err != nil {
		return &models.CustomeResponse{
			Msg:     "Invalid password, faild to create token",
			Context: false,
		}
	}

	return &models.CustomeResponse{
		Msg:     tokenString,
		Context: true,
	}

}

func (r *Repository) Register(body models.CreateUserBody) *models.CustomeResponse {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	users := r.Mg.Db.Collection("users")
	hashPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	query := bson.D{primitive.E{Key: "email", Value: body.Email}}

	if err != nil {
		fmt.Println(err)
		return &models.CustomeResponse{
			Msg:     "Couldn't hash the password",
			Context: false,
		}
	}

	requestBody := &models.CreateUserBody{
		Username: body.Username,
		Email:    body.Email,
		Password: string(hashPassword),
	}

	// handling if there is no user found in the database

	databseUser := users.FindOne(ctx, query)
	if err := databseUser.Err(); err != nil {
		fmt.Println("There is no user found with that email")
	}

	existingUser := &models.CreateUserBody{}

	databseUser.Decode(existingUser)

	if existingUser.Email == body.Email {
		return &models.CustomeResponse{
			Msg:     "This user with the current email already exists!",
			Context: false,
		}
	}

	insertedUser, err := users.InsertOne(ctx, requestBody)

	users.FindOne(ctx, bson.D{{Key: "_id", Value: insertedUser.InsertedID}})

	if err != nil {
		fmt.Println(err)
		return &models.CustomeResponse{
			Msg:     "Couldn't insert the new user into the database",
			Context: false,
		}
	}

	return &models.CustomeResponse{
		Msg:     "Created the new user",
		Context: true,
	}
}
