package repository

import (
	"database/sql"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	models "iLeon/microservices/models"
)

type CustomersRepository interface {
	FindAll() (*[]models.Customer, error)
	FindOne(id string) (*models.Customer, error)
	Create(body *models.Customer) (*models.Customer, error)
	Update(body *models.Customer, customerId string) (*models.Customer, error)
	Delete(customerId string) error
}

type Repository struct {
	DB *sql.DB
}

func NewRepo(db *sql.DB) CustomersRepository {
	return &Repository{
		DB: db,
	}
}

func (r *Repository) FindAll() (*[]models.Customer, error) {
	var customers []models.Customer
	rows, err := r.DB.Query("select customer_id, contact_name, city, country from customers")

	if err != nil {
		return nil, err
	}

	for rows.Next() {
		customer := models.Customer{}
		err := rows.Scan(&customer.CustomerID, &customer.ContactName, &customer.City, &customer.Country)
		if err != nil {
			fmt.Println(err)
		}
		customers = append(customers, customer)
	}
	return &customers, nil

}

func (r *Repository) FindOne(customerId string) (*models.Customer, error) {
	customer := &models.Customer{}

	data := r.DB.QueryRow("select customer_id, contact_name, city, country from customers where customer_id = $1", customerId)

	err := data.Scan(
		&customer.CustomerID,
		&customer.ContactName,
		&customer.City,
		&customer.Country,
	)

	if err != nil {
		return nil, err
	}

	return customer, nil
}

func (r *Repository) Create(body *models.Customer) (*models.Customer, error) {

	_, err := r.DB.Query("insert into customers (customer_id, contact_name, city, country) values ($1, $2, $3, $4)",
		body.CustomerID,
		body.ContactName,
		body.City,
		body.Country,
	)

	if err != nil {
		return nil, err
	}

	return body, nil
}

func (r *Repository) Update(body *models.Customer, customerId string) (*models.Customer, error) {
	fmt.Println(body.ContactName)
	query := sq.Update("customers").PlaceholderFormat(sq.Dollar).Where(sq.Eq{"customer_id": customerId})

	if body.ContactName != nil {
		query = query.Set("contact_name", body.ContactName)
	}

	if body.City != nil {
		query = query.Set("city", body.City)
	}

	if body.Country != nil {
		query = query.Set("country", body.Country)
	}

	sqlStr, args, err := query.ToSql()

	if err != nil {
		return nil, err
	}

	_, err = r.DB.Exec(sqlStr, args...)

	if err != nil || err == sql.ErrNoRows {
		return nil, err
	}

	return body, nil
}

func (r *Repository) Delete(customerId string) error {
	err := r.DB.QueryRow("delete from customers WHERE customer_id=$1 RETURNING customer_id", customerId).Scan(&customerId)

	if err == sql.ErrNoRows {
		return err
	}

	return nil
}
