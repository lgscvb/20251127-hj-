<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

use App\Models\Bill;


class BillController extends Controller
{
    // 获取所有发票（带分页、排序和搜索功能）
    public function index(Request $request)
    {
        try {
            // 获取请求参数
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            $keyword = $request->get('keyword', '');
            $field = $request->get('field', 'all');
            
            // 构建查询
            $query = Bill::query();
            
            // 添加搜索条件
            if (!empty($keyword)) {
                if ($field === 'all' || empty($field)) {
                    // 搜索所有字段
                    $query->where(function ($q) use ($keyword) {
                        $q->where('invoice_number', 'like', "%{$keyword}%")
                          ->orWhere('invoice_period', 'like', "%{$keyword}%")
                          ->orWhere('date', 'like', "%{$keyword}%")
                          ->orWhere('company_name', 'like', "%{$keyword}%")
                          ->orWhere('customer_name', 'like', "%{$keyword}%")
                          ->orWhere('total_amount', 'like', "%{$keyword}%")
                          ->orWhere('tax_type', 'like', "%{$keyword}%");
                    });
                } else {
                    // 搜索特定字段
                    $query->where($field, 'like', "%{$keyword}%");
                }
            }
            
            // 按创建时间排序并分页
            $bills = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);
            
            return response()->json([
                'status' => 'success',
                'data' => $bills->items(),
                'pagination' => [
                    'current_page' => $bills->currentPage(),
                    'per_page' => $bills->perPage(),
                    'total' => $bills->total(),
                    'last_page' => $bills->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // 获取单个发票
    public function show($id)
    {
        try {
            $bill = Bill::findOrFail($id);
            return response()->json([
                'status' => 'success',
                'data' => $bill
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => '发票不存在'
            ], 404);
        }
    }

    // 创建发票
    public function store(Request $request)
    {
        try {
            // 验证请求数据
            $validated = $request->validate([
                'customer_id' => 'required|exists:customers,id',
                'customer_number' => 'nullable|string',
                'customer_name' => 'required|string',
                'company_name' => 'nullable|string',
                'invoice_number' => 'required|string',
                'invoice_period' => 'required|string',
                'date' => 'required|date',
                'time' => 'nullable|string',
                'buyer' => 'nullable|string',
                'address' => 'nullable|string',
                'total_amount' => 'required|numeric',
                'tax_type' => 'nullable|string',
                'has_stamp' => 'required|boolean',
                'seller_tax_id' => 'nullable|string',
                'file_path' => 'nullable|string',
                'ocr_text' => 'nullable|string',
                'items_data' => 'nullable|array'
            ]);

            // 打印接收到的数据以进行调试
            \Log::info('接收到的发票数据:', $request->all());
            
            // 确保 customer_id 存在
            if (!$request->has('customer_id')) {
                return response()->json([
                    'status' => 'error',
                    'message' => '缺少客户ID'
                ], 422);
            }

            // 使用更明确的方式创建发票记录
            $bill = new Bill();
            $bill->customer_id = $request->customer_id;
            $bill->customer_number = $request->customer_number;
            $bill->customer_name = $request->customer_name;
            $bill->company_name = $request->company_name;
            $bill->invoice_number = $request->invoice_number;
            $bill->invoice_period = $request->invoice_period;
            $bill->date = $request->date;
            $bill->time = $request->time;
            $bill->buyer = $request->buyer;
            $bill->address = $request->address;
            $bill->total_amount = $request->total_amount;
            $bill->tax_type = $request->tax_type;
            $bill->has_stamp = $request->has_stamp;
            $bill->seller_tax_id = $request->seller_tax_id;
            $bill->file_path = $request->file_path;
            $bill->ocr_text = $request->ocr_text;
            $bill->items_data = $request->items_data;
            $bill->save();

            return response()->json([
                'status' => 'success',
                'message' => '发票保存成功',
                'data' => $bill
            ]);
        } catch (\Exception $e) {
            \Log::error('保存发票时出错: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // 更新发票
    public function update(Request $request, $id)
    {
        try {
            $bill = Bill::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'invoice_number' => 'string',
                'invoice_period' => 'string',
                'date' => 'date',
                'time' => 'nullable|string',
                'buyer' => 'nullable|string',
                'address' => 'nullable|string',
                'total_amount' => 'numeric',
                'tax_type' => 'nullable|string',
                'has_stamp' => 'boolean',
                'seller_tax_id' => 'nullable|string',
                'file_path' => 'nullable|string',
                'ocr_text' => 'nullable|string',
                'items_data' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => $validator->errors()
                ], 422);
            }

            $bill->update($request->all());

            return response()->json([
                'status' => 'success',
                'message' => '发票更新成功',
                'data' => $bill
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // 删除发票
    public function destroy($id)
    {
        try {
            $bill = Bill::findOrFail($id);
            $bill->delete();

            return response()->json([
                'status' => 'success',
                'message' => '发票删除成功'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}