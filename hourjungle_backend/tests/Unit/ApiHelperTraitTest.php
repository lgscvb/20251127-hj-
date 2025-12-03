<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Controllers\Traits\ApiHelperTrait;

class ApiHelperTraitTest extends TestCase
{
    use ApiHelperTrait;

    public function test_format_date_with_valid_date(): void
    {
        $result = $this->formatDate('2024-01-15');
        $this->assertEquals('2024-01-15', $result);
    }

    public function test_format_date_with_slash_format(): void
    {
        $result = $this->formatDate('2024/01/15');
        $this->assertEquals('2024-01-15', $result);
    }

    public function test_format_date_with_empty_value(): void
    {
        $result = $this->formatDate('');
        $this->assertNull($result);
    }

    public function test_format_date_with_null(): void
    {
        $result = $this->formatDate(null);
        $this->assertNull($result);
    }

    public function test_format_date_with_excel_number(): void
    {
        // Excel date 44562 = 2022-01-01
        $result = $this->formatDate(44562);
        $this->assertNotNull($result);
    }

    public function test_transform_contract_status(): void
    {
        $this->assertEquals('Not Submitted', $this->transformContractStatus(0));
        $this->assertEquals('Under Review', $this->transformContractStatus(1));
        $this->assertEquals('Approved', $this->transformContractStatus(2));
        $this->assertEquals('Rejected', $this->transformContractStatus(3));
        $this->assertEquals('Unknown', $this->transformContractStatus(99));
    }

    public function test_success_response(): void
    {
        $response = $this->successResponse('Test message');
        $data = $response->getData(true);

        $this->assertTrue($data['status']);
        $this->assertEquals('Test message', $data['message']);
    }

    public function test_success_response_with_data(): void
    {
        $response = $this->successResponse('Test', ['key' => 'value']);
        $data = $response->getData(true);

        $this->assertTrue($data['status']);
        $this->assertArrayHasKey('data', $data);
        $this->assertEquals('value', $data['data']['key']);
    }

    public function test_error_response(): void
    {
        $response = $this->errorResponse('Error message');
        $data = $response->getData(true);

        $this->assertFalse($data['status']);
        $this->assertEquals('Error message', $data['message']);
    }

    public function test_unauthorized_response(): void
    {
        $response = $this->unauthorizedResponse();

        $this->assertEquals(401, $response->getStatusCode());
    }
}
