import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getProjectInfo, confirmContract, uploadContractPdf, getPublicProjectInfo } from '@/redux/actions';
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Button,
} from "@material-tailwind/react";
import { PrinterIcon, ArrowDownTrayIcon, CheckIcon } from "@heroicons/react/24/solid";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import axios from 'axios';



// 簽名板元件
const SignatureCanvas = ({ onSave }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.lineCap = 'round'; // 讓線條末端圓滑
        ctx.lineJoin = 'round'; // 讓線條連接處圓滑
        setContext(ctx);
    }, []);

    const getCoordinates = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // 處理觸控事件
        if (event.touches && event.touches[0]) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
        }
        
        // 處理滑鼠事件
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    const startDrawing = (event) => {
        event.preventDefault();
        const coords = getCoordinates(event);
        context.beginPath();
        context.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (event) => {
        event.preventDefault();
        if (!isDrawing) return;
        
        const coords = getCoordinates(event);
        context.lineTo(coords.x, coords.y);
        context.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            context.closePath();
            setIsDrawing(false);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const saveSignature = () => {
        const signature = canvasRef.current.toDataURL('image/png');
        onSave(signature);
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <canvas
                ref={canvasRef}
                width={300}
                height={150}
                className="border border-gray-300 rounded cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ touchAction: 'none' }} // 防止觸控設備上的滾動
            />
            <div className="flex gap-2">
                <Button size="sm" color="red" onClick={clearCanvas}>
                    清除
                </Button>
                <Button size="sm" color="green" onClick={saveSignature}>
                    確認簽名
                </Button>
            </div>
        </div>
    );
};

export function Contract() {
    const { customerId, date, projectId } = useParams();
    const dispatch = useDispatch();
    const [contractData, setContractData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [signature, setSignature] = useState(null);
    const contractRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchContractData = async () => {
            try {
                if (projectId === 'preview') {
                    if (window.contractData) {
                        setContractData(window.contractData);
                        setLoading(false);
                        return;
                    }
                } else {
                    const result = await dispatch(getPublicProjectInfo(projectId));
                    if (result.success) {
                        setContractData(result.data);
                    } else {
                        throw new Error(result.message);
                    }
                }
            } catch (error) {
                console.error('載入合約資料失敗:', error);
                alert('載入合約資料失敗');
            } finally {
                setLoading(false);
            }
        };

        fetchContractData();
    }, [dispatch, projectId]);

    const generatePDF = async () => {
        const content = contractRef.current;
        
        // A4 比例 (210mm : 297mm = 1 : 1.414)
        const a4Ratio = 1.414;
        
        // 獲取內容實際尺寸
        const contentWidth = content.offsetWidth;
        const contentHeight = content.offsetHeight;
        
        // 基於內容高度計算對應的 A4 寬度
        const targetWidth = contentHeight / a4Ratio;
        
        // 計算縮放比例
        const scale = 2;
        
        const canvas = await html2canvas(content, {
            scale: scale,
            useCORS: true,
            logging: false,
            width: contentWidth,
            height: contentHeight,
            backgroundColor: '#ffffff',
            windowWidth: targetWidth
        });

        // 創建 PDF（A4 尺寸）
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 獲取 PDF 的尺寸
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // 將 canvas 轉換為圖片
        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // 計算需要的頁數
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // 計算每頁的高度（以 PDF 點為單位）
        const pageHeight = (pdfWidth * imgHeight) / imgWidth;
        const pagesCount = Math.ceil(pageHeight / pdfHeight);

        // 對每一頁進行處理
        for (let page = 0; page < pagesCount; page++) {
            // 如果不是第一頁，添加新頁面
            if (page > 0) {
                pdf.addPage();
            }

            // 計算當前頁的裁切位置
            const position = -page * pdfHeight;
            
            // 添加圖片到當前頁
            pdf.addImage(
                imgData,
                'JPEG',
                0,
                position,
                pdfWidth,
                pageHeight
            );
        }

        return pdf;
    };

    const handleDownload = async () => {
        try {
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
            const pdf = await generatePDF();
            pdf.save(`contract_${contractData.projectId}_${timestamp}.pdf`);
        } catch (error) {
            console.error('下載合約失敗:', error);
            alert('下載合約失敗，請稍後重試');
        }
    };

    const handleConfirm = async () => {
        if (!signature) {
            alert('請先完成簽名');
            return;
        }

        try {
            setIsLoading(true);
            
            // 修改 PDF 生成和轉換方式
            const pdf = await generatePDF();
            const blob = pdf.output('blob');
            const pdfBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result);
                };
                reader.readAsDataURL(blob);
            });

            console.log('PDF base64 length:', pdfBase64.length);
            console.log('PDF base64 prefix:', pdfBase64.substring(0, 50));

            const result = await dispatch(uploadContractPdf({
                project_id: contractData.projectId,
                pdf_file: pdfBase64,
                signature: signature
            }));

            if (result.success) {
                alert('合約簽署成功，請待人員確認，將以LINE回復您');
                window.close();
            } else {
                alert(result.message || '確認失敗');
            }
        } catch (error) {
            console.error('確認合約失敗:', error);
            alert('確認合約失敗，請稍後重試');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignatureSave = (signatureData) => {
        setSignature(signatureData);
    };

    if (loading) {
        return <div>載入中...</div>;
    }

    if (!contractData) {
        return <div>無法載入合約資料</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-8 contract-container">
            <Card className="w-full shadow-lg print:shadow-none">
                <CardHeader
                    color="green"
                    className="relative h-16 flex items-center justify-between px-4 print:hidden"
                >
                    <Typography variant="h4" color="white">
                        合約預覽
                    </Typography>
                    <div className="flex gap-2">
                        <Button
                            className="flex items-center gap-2"
                            size="sm"
                            onClick={handleDownload}
                            color="white"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4" /> 下載合約
                        </Button>
                        <Button
                            className="flex items-center gap-2"
                            size="sm"
                            onClick={handleConfirm}
                            color="white"
                        >
                            <CheckIcon className="h-4 w-4" /> 確認合約
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="p-8" ref={contractRef}>
                    {/* Logo */}
                    <div className="flex justify-center mb-6 print:mb-8">
                        <img
                            src="/img/logo-ct-dark.png"
                            alt="Hour Jungle Logo"
                            className="h-12 print:h-16"
                        />
                    </div>

                    {/* 合約標題 */}
                    <Typography variant="h3" className="text-center mb-8">
                        租賃契約書
                    </Typography>

                    {/* 前言 */}
                    <div className="mb-8">
                        <Typography>立契約書人：</Typography>
                        <Typography className="ml-8 my-2">
                            出租人：{contractData.branchName}（以下簡稱甲方）
                        </Typography>
                        <Typography className="ml-8 my-2">
                            承租人：{contractData.customerName}（以下簡稱乙方）
                        </Typography>
                    </div>

                    {/* 第一條 */}
                    <div className="mb-8">
                        <Typography variant="h6" color="green" className="mb-2">
                            第一條：租賃標的
                        </Typography>
                        <Typography className="ml-8">
                            一、租賃標的物：{contractData.businessItemName}
                        </Typography>
                    </div>

                    {/* 第二條 */}
                    <div className="mb-8">
                        <Typography variant="h6" color="green" className="mb-2">
                            第二條：租賃期間
                        </Typography>
                        <Typography className="ml-8">
                            一、租賃期間自 {contractData.start_day} 起至 {contractData.end_day} 止。
                        </Typography>
                    </div>

                    {/* 第三條 */}
                    <div className="mb-8">
                        <Typography variant="h6" color="green" className="mb-2">
                            第三條：租金及支付方式
                        </Typography>
                        <Typography className="ml-8 my-2">
                            一、租金：每期新台幣 {parseFloat(contractData.current_payment).toLocaleString()} 元整。
                        </Typography>
                        <Typography className="ml-8 my-2">
                            二、付款方式：於每月 {contractData.pay_day} 日前支付。
                        </Typography>
                        <Typography className="ml-8 my-2">
                            三、押金：新台幣 {parseFloat(contractData.deposit).toLocaleString()} 元整。
                        </Typography>
                    </div>

                    {/* 第四條 */}
                    <div className="mb-8">
                        <Typography variant="h6" color="green" className="mb-2">
                            第四條：違約及罰則
                        </Typography>
                        <Typography className="ml-8 my-2">
                            一、違約金：新台幣 {parseFloat(contractData.penaltyFee).toLocaleString()} 元整。
                        </Typography>
                        <Typography className="ml-8 my-2">
                            二、逾期付款：逾期未付，按日收取租金 {contractData.lateFee}% 之滯納金。
                        </Typography>
                    </div>

                    {/* 修改簽名欄部分 */}
                    <div className="mt-16">
                        <Typography variant="h6" color="green" className="mb-4">
                            立契約書人：
                        </Typography>
                        <div className="grid grid-cols-2 gap-16 px-8">
                            <div>
                                <Typography className="mb-4 font-bold">甲方：{contractData.branchName}</Typography>
                                <Typography className="mb-2">負責人：</Typography>
                                <Typography className="mb-2">統一編號：</Typography>
                                <Typography className="mb-2">地址：</Typography>
                                <div className="mt-8 border-t border-green-500 pt-4">
                                    簽章：
                                </div>
                            </div>
                            <div>
                                <Typography className="mb-4 font-bold">乙方：{contractData.customerName}</Typography>
                                <Typography className="mb-2">身分證字號：</Typography>
                                <Typography className="mb-2">電話：</Typography>
                                <Typography className="mb-2">地址：</Typography>
                                <div className="mt-8">
                                    <Typography className="mb-2">簽章：</Typography>
                                    {signature ? (
                                        <img src={signature} alt="簽名" className="max-w-[300px]" />
                                    ) : (
                                        <SignatureCanvas onSave={handleSignatureSave} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 日期 */}
                    <div className="text-center mt-16">
                        <Typography>
                            簽約日期：{contractData.signing_day}
                        </Typography>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

export default Contract; 