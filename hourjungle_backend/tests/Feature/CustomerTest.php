<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Customer;
use App\Models\Branch;
use App\Models\Member;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    protected $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test branch
        Branch::create([
            'id' => 1,
            'name' => 'Main Branch',
            'status' => 1,
        ]);

        // Create test user with token
        Member::create([
            'account' => 'admin',
            'password' => Hash::make('password123'),
            'nickname' => 'Admin',
            'status' => 1,
            'token' => 'test-token-123',
            'branch_id' => 1,
        ]);

        $this->token = 'test-token-123';

        // Create test customer
        Customer::create([
            'name' => 'Test Customer',
            'phone' => '0912345678',
            'branch_id' => 1,
        ]);
    }

    public function test_get_customers_list(): void
    {
        $response = $this->getJson('/api/get-customers-list');

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
            ])
            ->assertJsonStructure([
                'data',
                'current_page',
                'per_page',
                'total',
            ]);
    }

    public function test_get_customers_list_with_keyword(): void
    {
        $response = $this->getJson('/api/get-customers-list?keyword=Test');

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
            ]);
    }

    public function test_create_customer_requires_auth(): void
    {
        $response = $this->postJson('/api/create-customer', [
            'name' => 'New Customer',
        ]);

        $response->assertStatus(401);
    }

    public function test_create_customer_with_auth(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/create-customer', [
                'name' => 'New Customer',
                'phone' => '0923456789',
                'branch_id' => 1,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
            ]);

        $this->assertDatabaseHas('customers', [
            'name' => 'New Customer',
        ]);
    }

    public function test_get_customer_info(): void
    {
        $customer = Customer::first();

        $response = $this->postJson('/api/get-customer-info', [
            'id' => $customer->id,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
            ]);
    }
}
