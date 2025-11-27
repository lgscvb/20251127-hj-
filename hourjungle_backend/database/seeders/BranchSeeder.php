<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\LineBot;

class BranchSeeder extends Seeder
{
    public function run()
    {
        Branch::create([
            'name' => '台北信義安和館',
            'address' => '台北市大安區信義路四段170號3樓',
            'phone' => '02-27098170',
            'email' => 'main@example.com',
            'manager' => '王經理',
            'manager_phone' => '0912345678',
            'status' => 1
        ]);
        LineBot::create([
            'branch_id' => 1,
            'payment_notice' => '繳費提醒，  [name] 您好, 您的專案 [project_name] 下次繳費日為 [next_pay_day] ,請您盡早繳納金額 [amount] 元, 謝謝! 可以使用以下方式付款,麻煩匯款備註您的公司名以利查帳用,若完成匯款；再麻煩提供帳戶後五碼供查詢 如欲付現金請聯繫告知，謝謝。 匯款:  帳戶名稱：你的空間有限公司 銀行名稱：永豐商業銀行(南台中分行) 行庫代號：807 帳號：03801800183399',
            'renewql_notice' => '續約提醒， 您好, [name] 您的專案編號 [project_name] 於 [end_day] 到期，請提前續約，謝謝。',
            'channel_secret' => 'channel_secret_1',
            'channel_token' => 'channel_token_1',
            'liff_id' => 'liff_id_1',
        ]);

        Branch::create([
            'name' => '台中館大忠館',
            'address' => '台中市西區大忠南街55號七樓之五',
            'phone' => '04-23760282',
            'email' => 'branch-a@example.com',
            'manager' => '戴經理',
            'manager_phone' => '0923456789',
            'status' => 1
        ]);
        LineBot::create([
            'branch_id' => 2,
            'payment_notice' => '繳費提醒，  [name] 您好, 您的專案 [project_name] 下次繳費日為 [next_pay_day] ,請您盡早繳納金額 [amount] 元, 謝謝! 可以使用以下方式付款,麻煩匯款備註您的公司名以利查帳用,若完成匯款；再麻煩提供帳戶後五碼供查詢 如欲付現金請聯繫告知，謝謝。 匯款:  帳戶名稱：你的空間有限公司 銀行名稱：永豐商業銀行(南台中分行) 行庫代號：807 帳號：03801800183399',
            'renewql_notice' => '續約提醒， 您好, [name] 您的專案編號 [project_name] 於 [end_day] 到期，請提前續約，謝謝。',
            'channel_secret' => 'channel_secret_2',
            'channel_token' => 'channel_token_2',
            'liff_id' => 'liff_id_2',
        ]);
        
        Branch::create([
            'name' => '台南東寧館',
            'address' => '台南市東區東寧路429號2樓',
            'phone' => '06-2080332',
            'email' => 'branch-a@example.com',
            'manager' => '李經理',
            'manager_phone' => '0923456789',
            'status' => 1
        ]);
        LineBot::create([
            'branch_id' => 3,
            'payment_notice' => '繳費提醒，  [name] 您好, 您的專案 [project_name] 下次繳費日為 [next_pay_day] ,請您盡早繳納金額 [amount] 元, 謝謝! 可以使用以下方式付款,麻煩匯款備註您的公司名以利查帳用,若完成匯款；再麻煩提供帳戶後五碼供查詢 如欲付現金請聯繫告知，謝謝。 匯款:  帳戶名稱：你的空間有限公司 銀行名稱：永豐商業銀行(南台中分行) 行庫代號：807 帳號：03801800183399',
            'renewql_notice' => '續約提醒， 您好, [name] 您的專案編號 [project_name] 於 [end_day] 到期，請提前續約，謝謝。',
            'channel_secret' => 'channel_secret_3',
            'channel_token' => 'channel_token_3',
            'liff_id' => 'liff_id_3',
        ]);

        Branch::create([
            'name' => '台南崇學館',
            'address' => '台南市東區崇學路100號',
            'phone' => '06-2901650',
            'email' => 'branch-a@example.com',
            'manager' => '李經理',
            'manager_phone' => '0923456789',
            'status' => 1
        ]);
        LineBot::create([
            'branch_id' => 4,
            'payment_notice' => '繳費提醒，  [name] 您好, 您的專案 [project_name] 下次繳費日為 [next_pay_day] ,請您盡早繳納金額 [amount] 元, 謝謝! 可以使用以下方式付款,麻煩匯款備註您的公司名以利查帳用,若完成匯款；再麻煩提供帳戶後五碼供查詢 如欲付現金請聯繫告知，謝謝。 匯款:  帳戶名稱：你的空間有限公司 銀行名稱：永豐商業銀行(南台中分行) 行庫代號：807 帳號：03801800183399',
            'renewql_notice' => '續約提醒， 您好, [name] 您的專案編號 [project_name] 於 [end_day] 到期，請提前續約，謝謝。',
            'channel_secret' => 'channel_secret_4',
            'channel_token' => 'channel_token_4',
            'liff_id' => 'liff_id_4',
        ]);
        
        Branch::create([
            'name' => '台南中山館',
            'address' => '台南市中西區中山路193號',
            'phone' => '06-2238868',
            'email' => 'branch-a@example.com',
            'manager' => '李經理',
            'manager_phone' => '0923456789',
            'status' => 1
        ]);
        LineBot::create([
            'branch_id' => 5,
            'payment_notice' => '繳費提醒，  [name] 您好, 您的專案 [project_name] 下次繳費日為 [next_pay_day] ,請您盡早繳納金額 [amount] 元, 謝謝! 可以使用以下方式付款,麻煩匯款備註您的公司名以利查帳用,若完成匯款；再麻煩提供帳戶後五碼供查詢 如欲付現金請聯繫告知，謝謝。 匯款:  帳戶名稱：你的空間有限公司 銀行名稱：永豐商業銀行(南台中分行) 行庫代號：807 帳號：03801800183399',
            'renewql_notice' => '續約提醒， 您好, [name] 您的專案編號 [project_name] 於 [end_day] 到期，請提前續約，謝謝。',
            'channel_secret' => 'channel_secret_5',
            'channel_token' => 'channel_token_5',
            'liff_id' => 'liff_id_5',
        ]);
        
    }
} 