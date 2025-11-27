<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->string('customer_number');
            $table->string('customer_name');
            $table->string('company_name')->nullable();
            $table->string('invoice_number');
            $table->string('invoice_period');
            $table->date('date');
            $table->string('time')->nullable();
            $table->string('buyer')->nullable();
            $table->string('address')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->string('tax_type')->nullable();
            $table->boolean('has_stamp');
            $table->string('seller_tax_id')->nullable();
            $table->string('file_path')->nullable();
            $table->text('ocr_text')->nullable();
            $table->json('items_data')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
