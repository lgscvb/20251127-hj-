<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Branch;
use App\Http\Controllers\Traits\ApiHelperTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\CustomersExport;

/**
 * 客戶管理 Controller
 *
 * 處理客戶 CRUD 及匯入匯出功能
 */
class CustomerController extends Controller
{
    use ApiHelperTrait;

    /**
     * 取得客戶列表
     */
    public function getCustomersList(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $keyword = $request->get('keyword');
            $branchId = $request->get('branch_id');

            $query = Customer::query()
                ->leftJoin('branches', 'customers.branch_id', '=', 'branches.id')
                ->select(
                    'customers.*',
                    'branches.name as branch_name'
                );

            if ($branchId) {
                $query->where('customers.branch_id', $branchId);
            }

            if ($keyword) {
                $query->where(function ($q) use ($keyword) {
                    $q->where('customers.name', 'like', "%{$keyword}%")
                        ->orWhere('customers.phone', 'like', "%{$keyword}%")
                        ->orWhere('customers.email', 'like', "%{$keyword}%")
                        ->orWhere('customers.company_name', 'like', "%{$keyword}%");
                });
            }

            \Log::info('Customer query:', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'branch_id' => $branchId,
                'keyword' => $keyword
            ]);

            $customers = $query->paginate($perPage);

            \Log::info('Customers data:', [
                'count' => $customers->count(),
                'total' => $customers->total(),
                'data' => $customers->items()
            ]);

            $customers->getCollection()->transform(function ($customer) {
                return [
                    'id' => $customer->id,
                    'number' => $customer->number,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'birthday' => $customer->birthday,
                    'address' => $customer->address,
                    'company_name' => $customer->company_name,
                    'company_number' => $customer->company_number,
                    'company_website' => $customer->company_website,
                    'company_email' => $customer->company_email,
                    'company_address' => $customer->company_address,
                    'company_phone' => $customer->company_phone,
                    'company_fax' => $customer->company_fax,
                    'company_contact_person' => $customer->company_contact_person,
                    'company_contact_person_phone' => $customer->company_contact_person_phone,
                    'company_contact_person_email' => $customer->company_contact_person_email,
                    'line_id' => $customer->line_id,
                    'line_nickname' => $customer->line_nickname,
                    'branch_id' => $customer->branch_id,
                    'branch_name' => $customer->branch_name,
                    'status' => $customer->status,
                    'created_at' => $customer->created_at->format('Y-m-d H:i:s')
                ];
            });

            return response()->json([
                'status' => true,
                'message' => '獲取成功',
                'data' => $customers->items(),
                'current_page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('獲取失敗：' . $e->getMessage(), 500);
        }
    }

    /**
     * 新增客戶
     */
    public function createCustomer(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            if (empty($request->get('name'))) {
                return $this->errorResponse('客戶姓名不能為空');
            }

            $customerData = $request->all();

            if (!isset($customerData['branch_id']) || empty($customerData['branch_id'])) {
                $customerData['branch_id'] = $member->branch_id;
            }

            $customer = new Customer();
            $customer->fill($customerData);
            $customer->branch_id = $customerData['branch_id'];
            $customer->save();

            // 處理照片上傳
            if ($request->hasFile('id_card_front')) {
                $customer->id_card_front = $this->handleImageUpload(
                    $request->file('id_card_front'),
                    'customer_id_card_front',
                    $customer->id
                );
            }

            if ($request->hasFile('id_card_back')) {
                $customer->id_card_back = $this->handleImageUpload(
                    $request->file('id_card_back'),
                    'customer_id_card_back',
                    $customer->id
                );
            }

            $customer->save();

            // 獲取分館名稱
            $branch = Branch::find($customer->branch_id);
            $customer->branch_name = $branch ? $branch->name : null;

            // 系統日誌
            $customer_status = $customer->status == 1 ? '啟用' : '停用';
            $systemlog_description = '[新增客戶] 客戶姓名:' . $customer->name .
                ' 客戶電話:' . $customer->phone .
                ' 客戶電子郵件:' . $customer->email .
                ' 客戶地址:' . $customer->address .
                ' 客戶公司名稱:' . $customer->company_name .
                ' 客戶公司統一編號:' . $customer->company_number .
                ' 客戶公司網址:' . $customer->company_website .
                ' 客戶公司電話:' . $customer->company_phone .
                ' 客戶公司傳真:' . $customer->company_fax .
                ' 客戶公司聯絡人:' . $customer->company_contact_person .
                ' 客戶公司聯絡人電話:' . $customer->company_contact_person_phone .
                ' 客戶公司聯絡人電子郵件:' . $customer->company_contact_person_email .
                ' 客戶Line ID:' . $customer->line_id .
                ' 客戶Line 暱稱:' . $customer->line_nickname .
                ' 客戶狀態:' . $customer_status .
                ' 客戶備註:' . $customer->remark;
            $this->createSystemLog($member->id, '新增', $systemlog_description, 'customers', $customer->id, 'create');

            return $this->successResponse('新增成功', $customer);
        } catch (\Exception $e) {
            \Log::error('Create customer error: ' . $e->getMessage());
            return $this->errorResponse('新增失敗：' . $e->getMessage());
        }
    }

    /**
     * 修改客戶
     */
    public function updateCustomer(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            \Log::info('Update customer request data:', $request->all());

            $customer = Customer::find($request->id);
            if (!$customer) {
                return $this->errorResponse('客戶不存在');
            }

            // 檢查客戶編號是否重複
            if ($request->get('number') !== $customer->number) {
                $existingCustomer = Customer::where('number', $request->get('number'))
                    ->where('id', '!=', $request->id)
                    ->first();
                if ($existingCustomer) {
                    return $this->errorResponse('客戶編號已存在');
                }
            }

            if (empty($request->get('name'))) {
                return $this->errorResponse('客戶姓名不能為空');
            }

            $updateData = [
                'number' => $request->get('number'),
                'name' => $request->get('name'),
                'email' => $request->get('email'),
                'id_number' => $request->get('id_number'),
                'birthday' => $request->get('birthday'),
                'address' => $request->get('address'),
                'phone' => $request->get('phone'),
                'company_name' => $request->get('company_name'),
                'company_number' => $request->get('company_number'),
                'company_website' => $request->get('company_website'),
                'company_email' => $request->get('company_email'),
                'company_address' => $request->get('company_address'),
                'company_phone' => $request->get('company_phone'),
                'company_fax' => $request->get('company_fax'),
                'company_contact_person' => $request->get('company_contact_person'),
                'company_contact_person_phone' => $request->get('company_contact_person_phone'),
                'company_contact_person_email' => $request->get('company_contact_person_email'),
                'line_id' => $request->get('line_id'),
                'line_nickname' => $request->get('line_nickname'),
                'status' => $request->get('status') ? 1 : 0,
                'modify' => $request->get('modify') ? 1 : 0,
                'remark' => $request->get('remark'),
                'updated_at' => now()
            ];

            // 處理照片更新
            if ($request->hasFile('id_card_front')) {
                if ($customer->id_card_front) {
                    Storage::disk('public')->delete($customer->id_card_front);
                }
                $updateData['id_card_front'] = $this->handleImageUpload(
                    $request->file('id_card_front'),
                    'customer_id_card_front',
                    $customer->id
                );
            }

            if ($request->hasFile('id_card_back')) {
                if ($customer->id_card_back) {
                    Storage::disk('public')->delete($customer->id_card_back);
                }
                $updateData['id_card_back'] = $this->handleImageUpload(
                    $request->file('id_card_back'),
                    'customer_id_card_back',
                    $customer->id
                );
            }

            \Log::info('Update data:', $updateData);

            $customer->update($updateData);
            $customer->save();

            // 系統日誌
            $customer_status = $customer->status == 1 ? '啟用' : '停用';
            $systemlog_description = '[修改客戶] 客戶姓名:' . $customer->name .
                ' 客戶電話:' . $customer->phone .
                ' 客戶電子郵件:' . $customer->email .
                ' 客戶地址:' . $customer->address .
                ' 客戶公司名稱:' . $customer->company_name .
                ' 客戶公司統一編號:' . $customer->company_number .
                ' 客戶公司網址:' . $customer->company_website .
                ' 客戶公司電話:' . $customer->company_phone .
                ' 客戶公司傳真:' . $customer->company_fax .
                ' 客戶公司聯絡人:' . $customer->company_contact_person .
                ' 客戶公司聯絡人電話:' . $customer->company_contact_person_phone .
                ' 客戶公司聯絡人電子郵件:' . $customer->company_contact_person_email .
                ' 客戶Line ID:' . $customer->line_id .
                ' 客戶Line 暱稱:' . $customer->line_nickname .
                ' 客戶狀態:' . $customer_status .
                ' 客戶備註:' . $customer->remark;
            $this->createSystemLog($member->id, '修改', $systemlog_description, 'customers', $customer->id, 'update');

            return $this->successResponse('更新成功');
        } catch (\Exception $e) {
            \Log::error('Update customer error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->errorResponse('更新失敗：' . $e->getMessage());
        }
    }

    /**
     * 刪除客戶
     */
    public function deleteCustomer(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $customer = Customer::find($request->id);
        if (!$customer) {
            return $this->errorResponse('客戶不存在');
        }

        $customer->delete();

        // 系統日誌
        $systemlog_description = '[刪除客戶] 客戶姓名:' . $customer->name;
        $this->createSystemLog($member->id, '刪除', $systemlog_description, 'customers', $customer->id, 'delete');

        return $this->successResponse('刪除成功');
    }

    /**
     * 取得客戶資訊
     */
    public function getCustomerInfo(Request $request)
    {
        $customer = Customer::find($request->id);
        if (!$customer) {
            return $this->errorResponse('客戶不存在');
        }

        return $this->successResponse('獲取成功', $customer);
    }

    /**
     * 匯出客戶資料範例
     */
    public function exportCustomersExample()
    {
        $customers = collect([
            (object)[
                'number' => '123',
                'name' => '張小明',
                'birthday' => '1990-01-15',
                'phone' => '0912345678',
                'address' => '台北市中山區中山北路一段1號',
                'id_number' => 'A123456789',
                'email' => 'ming@gmail.com',
                'company_name' => '張小明科技股份有限公司',
                'company_number' => '12345678',
                'company_phone_number' => '02-12345678',
                'company_fax_number' => '02-12345678',
                'company_website' => 'www.ming.com',
                'company_email' => 'ming@gmail.com',
                'company_address' => '台北市中山區中山北路一段1號',
                'company_contact_person' => '張小明',
                'company_contact_person_phone_number' => '0912345678',
                'company_contact_person_email' => 'ming@gmail.com',
                'branch_name' => '台北總館',
                'line_id' => 'mingline',
                'line_nickname' => '小明',
                'remark' => '備註',
                'status' => '啟用',
                'created_at' => now()
            ],
            (object)[
                'number' => '124',
                'name' => '李大華',
                'birthday' => '1985-03-20',
                'phone' => '0923456789',
                'address' => '台北市大安區忠孝東路四段50號',
                'id_number' => 'B987654321',
                'email' => 'david@gmail.com',
                'company_name' => '創新企業有限公司',
                'company_number' => '87654321',
                'company_phone_number' => '02-12345678',
                'company_fax_number' => '02-12345678',
                'company_website' => 'www.david.com',
                'company_email' => 'david@gmail.com',
                'company_address' => '台北市大安區忠孝東路四段50號',
                'company_contact_person' => '李大華',
                'company_contact_person_phone_number' => '0923456789',
                'company_contact_person_email' => 'david@gmail.com',
                'branch_name' => '台北總館',
                'line_id' => 'davidlee',
                'line_nickname' => '大華',
                'remark' => '備註',
                'status' => '啟用',
                'created_at' => now()
            ],
            (object)[
                'number' => '125',
                'name' => '王美麗',
                'birthday' => '1988-12-25',
                'phone' => '0934567890',
                'address' => '新北市板橋區中山路200號',
                'id_number' => 'C456789012',
                'email' => 'meiwei@gmail.com',
                'company_name' => '優質貿易有限公司',
                'company_number' => '23456789',
                'company_phone_number' => '02-12345678',
                'company_fax_number' => '02-12345678',
                'company_website' => 'www.meiwei.com',
                'company_email' => 'meiwei@gmail.com',
                'company_address' => '新北市板橋區中山路200號',
                'company_contact_person' => '王美麗',
                'company_contact_person_phone_number' => '0934567890',
                'company_contact_person_email' => 'meiwei@gmail.com',
                'branch_name' => '台北總館',
                'line_id' => 'meiwei',
                'line_nickname' => '美麗',
                'remark' => '備註',
                'status' => '啟用',
                'created_at' => now()
            ]
        ]);

        return Excel::download(new CustomersExport($customers), '客戶資料範例.xlsx');
    }

    /**
     * 匯出客戶資料
     */
    public function exportCustomers(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $query = Customer::query()
                ->leftJoin('branches', 'customers.branch_id', '=', 'branches.id')
                ->select(
                    'customers.*',
                    'branches.name as branch_name'
                );

            // 如果不是頂級帳號，只能看到自己分館的數據
            if (!$member->is_top_account) {
                $query->where('customers.branch_id', $member->branch_id);
            }

            if ($request->has('branch_id')) {
                $query->where('customers.branch_id', $request->branch_id);
            }

            if ($request->has('keyword')) {
                $keyword = $request->keyword;
                $query->where(function ($q) use ($keyword) {
                    $q->where('customers.name', 'like', "%{$keyword}%")
                        ->orWhere('customers.phone', 'like', "%{$keyword}%")
                        ->orWhere('customers.email', 'like', "%{$keyword}%")
                        ->orWhere('customers.company_name', 'like', "%{$keyword}%");
                });
            }

            $customers = $query->get();

            // 系統日誌
            $systemlog_description = '[匯出客戶資料] 匯出筆數:' . $customers->count();
            $this->createSystemLog($member->id, '匯出', $systemlog_description, 'customers', 0, 'export');

            $fileName = '客戶資料_' . date('YmdHis') . '.xlsx';
            return Excel::download(new CustomersExport($customers), $fileName);

        } catch (\Exception $e) {
            \Log::error('Export customers error: ' . $e->getMessage());
            return $this->errorResponse('匯出失敗：' . $e->getMessage());
        }
    }

    /**
     * 匯入客戶資料
     */
    public function importCustomers(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return $this->errorResponse('請上傳檔案');
            }

            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $file = $request->file('file');
            $rawData = Excel::toArray([], $file);

            if (empty($rawData) || empty($rawData[0]) || count($rawData[0]) < 2) {
                return $this->errorResponse('檔案格式不正確或沒有數據');
            }

            \Log::info('rawData: ' . json_encode($rawData));

            $headers = $rawData[0][0];
            $dataRows = array_slice($rawData[0], 1);

            DB::beginTransaction();
            $successCount = 0;
            $errorRows = [];

            foreach ($dataRows as $index => $row) {
                try {
                    $customerData = [];
                    for ($j = 0; $j < count($headers); $j++) {
                        if (isset($row[$j])) {
                            $headerKey = $headers[$j];
                            $customerData[$headerKey] = $row[$j];
                        }
                    }

                    $requiredFields = ['客戶編號', '客戶姓名', '生日', '電話', '地址', '身分證字號', '電子郵件', '公司名稱', '統一編號', '公司電話'];
                    foreach ($requiredFields as $field) {
                        if (!isset($customerData[$field])) {
                            $customerData[$field] = null;
                        }
                    }

                    $status = 1;
                    if (!empty($customerData['啟用狀態'])) {
                        $status = $customerData['啟用狀態'] == '啟用' ? 1 : 0;
                    }

                    // 處理分館
                    if (isset($customerData['所屬分館'])) {
                        $branch = Branch::where('name', $customerData['所屬分館'])->first();
                        if (!$branch) {
                            throw new \Exception('找不到相對應的分館: ' . $customerData['所屬分館']);
                        }
                    } else {
                        $branch = Branch::find($member->branch_id);
                        if (!$branch) {
                            throw new \Exception('找不到上傳者的分館訊息');
                        }
                    }

                    // 處理客戶編號
                    if (empty($customerData['客戶編號'])) {
                        $lastCustomer = Customer::orderBy('number', 'desc')->first();
                        if (empty($lastCustomer)) {
                            $number = 1;
                        } else {
                            $lastNumber = intval(preg_replace('/[^0-9]/', '', $lastCustomer->number));
                            $number = $lastNumber + 1;
                        }
                    } else {
                        $customer = Customer::where('number', $customerData['客戶編號'])->first();
                        if (!is_null($customer)) {
                            $lastCustomer = Customer::orderBy('number', 'desc')->first();
                            $lastNumber = intval(preg_replace('/[^0-9]/', '', $lastCustomer->number));
                            $number = $lastNumber + 1;
                        } else {
                            $number = $customerData['客戶編號'];
                        }
                    }

                    $customer = new Customer([
                        'number' => $number,
                        'name' => $customerData['客戶姓名'] ?? null,
                        'birthday' => array_key_exists('生日', $customerData) ? $this->formatDate($customerData['生日']) : null,
                        'phone' => $customerData['電話'] ?? null,
                        'address' => $customerData['地址'] ?? null,
                        'id_number' => $customerData['身分證字號'] ?? null,
                        'email' => $customerData['電子郵件'] ?? null,
                        'company_name' => $customerData['公司名稱'] ?? null,
                        'company_number' => $customerData['統一編號'] ?? null,
                        'company_phone_number' => $customerData['公司電話'] ?? null,
                        'company_fax_number' => $customerData['公司傳真'] ?? null,
                        'company_website' => $customerData['公司網站'] ?? null,
                        'company_email' => $customerData['公司電子郵件'] ?? null,
                        'company_address' => $customerData['公司地址'] ?? null,
                        'company_contact_person' => $customerData['聯絡人姓名'] ?? null,
                        'company_contact_person_phone_number' => $customerData['聯絡人電話'] ?? null,
                        'company_contact_person_email' => $customerData['聯絡人信箱'] ?? null,
                        'branch_id' => $branch->id,
                        'branch_name' => $branch->name,
                        'line_id' => $customerData['LineID'] ?? null,
                        'line_nickname' => $customerData['Line暱稱'] ?? null,
                        'remark' => $customerData['備注'] ?? null,
                        'status' => $status,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    $customer->save();
                    $successCount++;

                    \Log::info('Customer birthday data:', [
                        'original' => $customerData['生日'],
                        'formatted' => $customer->birthday
                    ]);

                } catch (\Exception $e) {
                    $errorRows[] = [
                        'row_index' => $index + 2,
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            $response = [
                'status' => true,
                'message' => "成功導入 {$successCount} 筆客戶資料"
            ];

            if (!empty($errorRows)) {
                $response['warnings'] = "有 " . count($errorRows) . " 筆數據導入失敗";
                $response['error_rows'] = $errorRows;
            }

            // 系統日誌
            $systemlog_description = '[匯入客戶資料] 匯入筆數:' . $successCount;
            $this->createSystemLog($member->id, '匯入', $systemlog_description, 'customers', 0, 'import');

            return response()->json($response);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Import customers error: ' . $e->getMessage());
            return $this->errorResponse('匯入失敗：' . $e->getMessage());
        }
    }
}
