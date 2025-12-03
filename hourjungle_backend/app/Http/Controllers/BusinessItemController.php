<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiHelperTrait;
use App\Models\BusinessItem;
use App\Models\Branch;
use App\Exports\BusinessItemsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class BusinessItemController extends Controller
{
    use ApiHelperTrait;

    public function createBusinessItem(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        if (!empty($request->number)) {
            $businessItem = BusinessItem::where('number', $request->number)->first();
            if ($businessItem) {
                return $this->errorResponse('Business item number already exists');
            }
        } else {
            $lastBusinessItem = BusinessItem::orderBy('number', 'desc')->first();
            $nextNumber = $lastBusinessItem ? $lastBusinessItem->number + 1 : 1;
            $request->merge(['number' => $nextNumber]);
        }

        if (empty($request->name)) {
            return $this->errorResponse('Business item name cannot be empty');
        }

        if (empty($request->price)) {
            $request->merge(['price' => 0]);
        }

        if (empty($request->deposit)) {
            $request->merge(['deposit' => 0]);
        }

        if (!empty($request->price) && !is_numeric($request->price)) {
            return $this->errorResponse('Price must be a number');
        }

        if (!empty($request->deposit) && !is_numeric($request->deposit)) {
            return $this->errorResponse('Deposit must be a number');
        }

        if (empty($request->branch_id)) {
            return $this->errorResponse('Please select a branch');
        }

        $branch = Branch::find($request->branch_id);
        if (!$branch) {
            return $this->errorResponse('Branch not found');
        }

        if (empty($request->status)) {
            $request->merge(['status' => 1]);
        }

        $businessItem = BusinessItem::create($request->all());

        $businessItem_status = $businessItem->status == 1 ? 'Active' : 'Inactive';
        $systemlog_description = '[Create Business Item] Number:'.$businessItem->number.' Name:'.$businessItem->name.' Price:'.$businessItem->price.' Deposit:'.$businessItem->deposit.' Status:'.$businessItem_status;
        $this->createSystemLog($member->id, 'Create', $systemlog_description, 'business_items', $businessItem->id, 'create');

        return $this->successResponse('Created successfully');
    }

    public function updateBusinessItem(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $businessItem = BusinessItem::find($request->id);
        if (!$businessItem) {
            return $this->errorResponse('Business item not found');
        }

        if (empty($request->name)) {
            return $this->errorResponse('Business item name cannot be empty');
        }

        if (empty($request->status)) {
            $request->merge(['status' => 1]);
        }

        $businessItem->update($request->all());

        $businessItem_status = $businessItem->status == 1 ? 'Active' : 'Inactive';
        $systemlog_description = '[Update Business Item] Number:'.$businessItem->number.' Name:'.$businessItem->name.' Price:'.$businessItem->price.' Deposit:'.$businessItem->deposit.' Status:'.$businessItem_status;
        $this->createSystemLog($member->id, 'Update', $systemlog_description, 'business_items', $businessItem->id, 'update');

        return $this->successResponse('Updated successfully');
    }

    public function deleteBusinessItem(Request $request)
    {
        $member = $this->isLogin();
        if (is_null($member)) {
            return $this->unauthorizedResponse();
        }

        $businessItem = BusinessItem::find($request->id);
        if (!$businessItem) {
            return $this->errorResponse('Business item not found');
        }

        $businessItem->delete();

        $systemlog_description = '[Delete Business Item] Number:'.$businessItem->number.' Name:'.$businessItem->name;
        $this->createSystemLog($member->id, 'Delete', $systemlog_description, 'business_items', $businessItem->id, 'delete');

        return $this->successResponse('Deleted successfully');
    }

    public function getBusinessItemList(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $keyword = $request->get('keyword');
            $branchId = $request->get('branch_id');

            $query = BusinessItem::query()
                ->leftJoin('branches', 'business_items.branch_id', '=', 'branches.id')
                ->select(
                    'business_items.*',
                    'branches.name as branch_name'
                );

            if ($branchId) {
                $query->where('business_items.branch_id', $branchId);
            }

            if ($keyword) {
                $query->where(function ($q) use ($keyword) {
                    $q->where('business_items.name', 'like', "%{$keyword}%")
                        ->orWhere('business_items.number', 'like', "%{$keyword}%")
                        ->orWhere('business_items.remarks', 'like', "%{$keyword}%");
                });
            }

            \Log::info('Business items query:', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'branch_id' => $branchId,
                'keyword' => $keyword
            ]);

            $items = $query->paginate($perPage);

            \Log::info('Business items data:', [
                'count' => $items->count(),
                'total' => $items->total(),
                'data' => $items->items()
            ]);

            $items->getCollection()->transform(function ($item) {
                return [
                    'id' => $item->id,
                    'number' => $item->number,
                    'name' => $item->name,
                    'price' => $item->price,
                    'deposit' => $item->deposit,
                    'branch_id' => $item->branch_id,
                    'branch_name' => $item->branch_name,
                    'remarks' => $item->remarks,
                    'status' => $item->status,
                    'created_at' => $item->created_at->format('Y-m-d H:i:s')
                ];
            });

            return response()->json([
                'status' => true,
                'message' => 'Success',
                'data' => $items->items(),
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total()
            ]);

        } catch (\Exception $e) {
            \Log::error('Get business items list error: ' . $e->getMessage());
            return $this->errorResponse('Failed: ' . $e->getMessage());
        }
    }

    public function getBusinessItemInfo(Request $request)
    {
        $businessItem = BusinessItem::with('branch')->find($request->id);
        if (!$businessItem) {
            return $this->errorResponse('Business item not found');
        }

        $data = [
            'id' => $businessItem->id,
            'number' => $businessItem->number,
            'name' => $businessItem->name,
            'price' => $businessItem->price,
            'deposit' => $businessItem->deposit,
            'branch_id' => $businessItem->branch_id,
            'branch_name' => $businessItem->branch ? $businessItem->branch->name : null,
            'status' => $businessItem->status,
            'remarks' => $businessItem->remarks,
            'created_at' => $businessItem->created_at,
            'updated_at' => $businessItem->updated_at
        ];

        return $this->successResponse('Success', $data);
    }

    public function exportBusinessItemsExample()
    {
        $businessItems = collect([
            (object)[
                'number' => '1',
                'name' => 'Business Item 1',
                'price' => 1000,
                'deposit' => 100,
                'status' => 'Active',
                'remark' => 'Remark',
                'branch_name' => 'Main Branch',
                'created_at' => now()
            ],
            (object)[
                'number' => '2',
                'name' => 'Business Item 2',
                'price' => 2000,
                'deposit' => 200,
                'status' => 'Active',
                'remark' => 'Remark',
                'branch_name' => 'Main Branch',
                'created_at' => now()
            ]
        ]);
        return Excel::download(new BusinessItemsExport($businessItems), 'business_items_example.xlsx');
    }

    public function exportBusinessItems(Request $request)
    {
        try {
            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $query = BusinessItem::query()
                ->leftJoin('branches', 'business_items.branch_id', '=', 'branches.id')
                ->select(
                    'business_items.*',
                    'branches.name as branch_name'
                );

            if (!$member->is_top_account) {
                $query->where('business_items.branch_id', $member->branch_id);
            }

            if ($request->has('branch_id')) {
                $query->where('business_items.branch_id', $request->branch_id);
            }

            $businessItems = $query->get();

            $systemlog_description = '[Export Business Items] Count:' . $businessItems->count();
            $this->createSystemLog($member->id, 'Export', $systemlog_description, 'business_items', 0, 'export');

            $fileName = 'business_items_' . date('YmdHis') . '.xlsx';

            return Excel::download(new BusinessItemsExport($businessItems), $fileName);

        } catch (\Exception $e) {
            \Log::error('Export business items error: ' . $e->getMessage());
            return $this->errorResponse('Export failed: ' . $e->getMessage());
        }
    }

    public function importBusinessItems(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return $this->errorResponse('Please upload a file');
            }

            $member = $this->isLogin();
            if (is_null($member)) {
                return $this->unauthorizedResponse();
            }

            $file = $request->file('file');

            $rawData = Excel::toArray([], $file);

            if (empty($rawData) || empty($rawData[0]) || count($rawData[0]) < 2) {
                return $this->errorResponse('Invalid file format or no data');
            }

            \Log::info('rawData: ' . json_encode($rawData));

            $headers = $rawData[0][0];
            $dataRows = array_slice($rawData[0], 1);

            DB::beginTransaction();
            $successCount = 0;
            $errorRows = [];

            foreach ($dataRows as $index => $row) {
                try {
                    $businessItemData = [];
                    for ($j = 0; $j < count($headers); $j++) {
                        if (isset($row[$j])) {
                            $headerKey = $headers[$j];
                            $businessItemData[$headerKey] = $row[$j];
                        }
                    }

                    $statusKey = isset($businessItemData['Status']) ? 'Status' : (isset($businessItemData['status']) ? 'status' : null);
                    if ($statusKey && $businessItemData[$statusKey] == 'Active') {
                        $status = 1;
                    } else {
                        $status = 0;
                    }

                    $branchNameKey = isset($businessItemData['Branch']) ? 'Branch' : (isset($businessItemData['branch_name']) ? 'branch_name' : null);
                    $branch_name = $branchNameKey ? $businessItemData[$branchNameKey] : null;
                    $branch = $branch_name ? Branch::where('name', 'like', '%'.$branch_name.'%')->first() : null;

                    if (!$branch) {
                        $branch_id = $member->branch_id;
                    } else {
                        $branch_id = $branch->id;
                    }

                    $numberKey = isset($businessItemData['Number']) ? 'Number' : (isset($businessItemData['number']) ? 'number' : null);
                    if (empty($businessItemData[$numberKey])) {
                        $lastBusinessItem = BusinessItem::orderBy('number', 'desc')->first();
                        $lastNumber = $lastBusinessItem ? intval(preg_replace('/[^0-9]/', '', $lastBusinessItem->number)) : 0;
                        $number = $lastNumber + 1;
                    } else {
                        $existingItem = BusinessItem::where('number', $businessItemData[$numberKey])->first();

                        if (is_null($existingItem)) {
                            $lastBusinessItem = BusinessItem::orderBy('number', 'desc')->first();
                            $lastNumber = $lastBusinessItem ? intval(preg_replace('/[^0-9]/', '', $lastBusinessItem->number)) : 0;
                            $number = $lastNumber + 1;
                        } else {
                            $number = $businessItemData[$numberKey];
                        }
                    }

                    $nameKey = isset($businessItemData['Name']) ? 'Name' : (isset($businessItemData['name']) ? 'name' : null);
                    $priceKey = isset($businessItemData['Price']) ? 'Price' : (isset($businessItemData['price']) ? 'price' : null);
                    $depositKey = isset($businessItemData['Deposit']) ? 'Deposit' : (isset($businessItemData['deposit']) ? 'deposit' : null);
                    $remarkKey = isset($businessItemData['Remark']) ? 'Remark' : (isset($businessItemData['remark']) ? 'remark' : null);
                    $createdAtKey = isset($businessItemData['Created At']) ? 'Created At' : (isset($businessItemData['created_at']) ? 'created_at' : null);

                    $businessItem = new BusinessItem([
                        'number' => $number,
                        'name' => $nameKey ? ($businessItemData[$nameKey] ?? null) : null,
                        'price' => $priceKey ? ($businessItemData[$priceKey] ?? null) : null,
                        'deposit' => $depositKey ? ($businessItemData[$depositKey] ?? null) : null,
                        'status' => $status,
                        'remark' => $remarkKey ? ($businessItemData[$remarkKey] ?? null) : null,
                        'branch_id' => $branch_id,
                        'created_at' => $createdAtKey ? ($this->formatDate($businessItemData[$createdAtKey], 'Y-m-d H:i:s') ?? now()) : now(),
                        'updated_at' => now()
                    ]);

                    $businessItem->save();
                    $successCount++;
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
                'message' => "Successfully imported {$successCount} business items"
            ];

            if (!empty($errorRows)) {
                $response['warnings'] = count($errorRows) . " rows failed to import";
                $response['error_rows'] = $errorRows;
            }

            $systemlog_description = '[Import Business Items] Count:' . $successCount;
            $this->createSystemLog($member->id, 'Import', $systemlog_description, 'business_items', 0, 'import');

            return response()->json($response);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Import business items error: ' . $e->getMessage());
            return $this->errorResponse('Import failed: ' . $e->getMessage());
        }
    }
}
