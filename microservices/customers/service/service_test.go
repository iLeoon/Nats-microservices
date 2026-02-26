package service_test

import (
	models "iLeon/microservices/models"
	repo "iLeon/microservices/repository"
	"iLeon/microservices/service"
	"testing"
)

// ── Manual mock for CustomersRepository ─────────────────────────────────────

type mockCustomerRepo struct {
	findAllFn  func() (*[]models.Customer, error)
	findOneFn  func(id string) (*models.Customer, error)
	createFn   func(body *models.Customer) (*models.Customer, error)
	updateFn   func(body *models.Customer, id string) (*models.Customer, error)
	deleteFn   func(id string) error
}

func (m *mockCustomerRepo) FindAll() (*[]models.Customer, error)  { return m.findAllFn() }
func (m *mockCustomerRepo) FindOne(id string) (*models.Customer, error) { return m.findOneFn(id) }
func (m *mockCustomerRepo) Create(b *models.Customer) (*models.Customer, error) { return m.createFn(b) }
func (m *mockCustomerRepo) Update(b *models.Customer, id string) (*models.Customer, error) {
	return m.updateFn(b, id)
}
func (m *mockCustomerRepo) Delete(id string) error { return m.deleteFn(id) }

// Compile-time check that mockCustomerRepo satisfies the interface
var _ repo.CustomersRepository = (*mockCustomerRepo)(nil)

func strPtr(s string) *string { return &s }

// ── FetchCustomers ───────────────────────────────────────────────────────────

func TestFetchCustomers_ReturnsAllCustomers(t *testing.T) {
	expected := &[]models.Customer{
		{CustomerID: "ABCD", ContactName: strPtr("Alice"), City: strPtr("Cairo"), Country: strPtr("Egypt")},
		{CustomerID: "EFGH", ContactName: strPtr("Bob"),   City: strPtr("London"), Country: strPtr("UK")},
	}
	svc := service.NewService(&mockCustomerRepo{
		findAllFn: func() (*[]models.Customer, error) { return expected, nil },
	})

	result, err := svc.FetchCustomers()

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(*result) != 2 {
		t.Errorf("expected 2 customers, got %d", len(*result))
	}
	if (*result)[0].CustomerID != "ABCD" {
		t.Errorf("expected first customer ABCD, got %s", (*result)[0].CustomerID)
	}
}

func TestFetchCustomers_ReturnsEmptySlice(t *testing.T) {
	svc := service.NewService(&mockCustomerRepo{
		findAllFn: func() (*[]models.Customer, error) { return &[]models.Customer{}, nil },
	})

	result, err := svc.FetchCustomers()

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(*result) != 0 {
		t.Errorf("expected empty slice, got %d items", len(*result))
	}
}

// ── FetchCustomer ────────────────────────────────────────────────────────────

func TestFetchCustomer_ReturnsCustomerById(t *testing.T) {
	c := &models.Customer{CustomerID: "ABCD", ContactName: strPtr("Alice")}
	svc := service.NewService(&mockCustomerRepo{
		findOneFn: func(id string) (*models.Customer, error) {
			if id == "ABCD" {
				return c, nil
			}
			return nil, nil
		},
	})

	result, err := svc.FetchCustomer("ABCD")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.CustomerID != "ABCD" {
		t.Errorf("expected customer ABCD, got %s", result.CustomerID)
	}
}

func TestFetchCustomer_DelegatesIdToRepository(t *testing.T) {
	capturedID := ""
	svc := service.NewService(&mockCustomerRepo{
		findOneFn: func(id string) (*models.Customer, error) {
			capturedID = id
			return &models.Customer{CustomerID: id}, nil
		},
	})

	svc.FetchCustomer("WXYZ")

	if capturedID != "WXYZ" {
		t.Errorf("expected repository to receive id WXYZ, got %q", capturedID)
	}
}

// ── InsertCustomer ───────────────────────────────────────────────────────────

func TestInsertCustomer_ReturnsCreatedCustomer(t *testing.T) {
	input := &models.Customer{
		CustomerID:  "NEW1",
		ContactName: strPtr("Charlie"),
		City:        strPtr("Paris"),
		Country:     strPtr("France"),
	}
	svc := service.NewService(&mockCustomerRepo{
		createFn: func(b *models.Customer) (*models.Customer, error) { return b, nil },
	})

	result, err := svc.InsertCustomer(input)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.CustomerID != "NEW1" {
		t.Errorf("expected CustomerID=NEW1, got %s", result.CustomerID)
	}
}

func TestInsertCustomer_DelegatesBodyToRepository(t *testing.T) {
	var captured *models.Customer
	svc := service.NewService(&mockCustomerRepo{
		createFn: func(b *models.Customer) (*models.Customer, error) {
			captured = b
			return b, nil
		},
	})

	payload := &models.Customer{CustomerID: "TSTR", ContactName: strPtr("Test")}
	svc.InsertCustomer(payload)

	if captured == nil || captured.CustomerID != "TSTR" {
		t.Errorf("repository received wrong payload")
	}
}

// ── ChangeCustomer ───────────────────────────────────────────────────────────

func TestChangeCustomer_UpdatesAndReturnsCustomer(t *testing.T) {
	updated := &models.Customer{CustomerID: "ABCD", City: strPtr("Alexandria")}
	svc := service.NewService(&mockCustomerRepo{
		updateFn: func(_ *models.Customer, _ string) (*models.Customer, error) {
			return updated, nil
		},
	})

	result, err := svc.ChangeCustomer(&models.Customer{City: strPtr("Alexandria")}, "ABCD")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if *result.City != "Alexandria" {
		t.Errorf("expected City=Alexandria, got %s", *result.City)
	}
}

func TestChangeCustomer_DelegatesIdToRepository(t *testing.T) {
	capturedID := ""
	svc := service.NewService(&mockCustomerRepo{
		updateFn: func(b *models.Customer, id string) (*models.Customer, error) {
			capturedID = id
			return b, nil
		},
	})

	svc.ChangeCustomer(&models.Customer{}, "ABCD")

	if capturedID != "ABCD" {
		t.Errorf("expected id ABCD to be passed to repository, got %q", capturedID)
	}
}
