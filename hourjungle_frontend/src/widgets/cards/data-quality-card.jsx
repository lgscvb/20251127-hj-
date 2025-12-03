import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
} from "@material-tailwind/react";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/**
 * 資料品質警告卡片
 * 顯示 CRM 資料的異常提醒
 */
export function DataQualityCard({ onClose }) {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    fetchWarnings();
  }, []);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/data-quality/warnings`);
      if (response.data.status) {
        setWarnings(response.data.data.warnings);
      }
    } catch (err) {
      setError("無法取得資料品質警告");
      console.error("Data quality fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "error":
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case "info":
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "error":
        return "red";
      case "warning":
        return "orange";
      case "info":
      default:
        return "blue";
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case "error":
        return "錯誤";
      case "warning":
        return "警告";
      case "info":
      default:
        return "提醒";
    }
  };

  if (loading) {
    return (
      <Card className="border border-blue-gray-100 shadow-sm">
        <CardBody className="flex items-center justify-center py-8">
          <Typography className="text-blue-gray-500">載入中...</Typography>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-100 shadow-sm">
        <CardBody className="flex items-center justify-center py-8">
          <Typography color="red">{error}</Typography>
        </CardBody>
      </Card>
    );
  }

  if (warnings.length === 0) {
    return (
      <Card className="border border-green-100 shadow-sm bg-green-50">
        <CardBody className="flex items-center justify-center py-8">
          <Typography color="green" className="flex items-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            資料品質良好，無異常警告
          </Typography>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-orange-100 shadow-sm">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="m-0 flex items-center justify-between p-4 bg-orange-50"
      >
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
          <Typography variant="h6" color="blue-gray">
            資料品質提醒
          </Typography>
          <Chip
            size="sm"
            value={`${warnings.length} 項`}
            color="orange"
            className="rounded-full"
          />
        </div>
        {onClose && (
          <IconButton
            variant="text"
            color="blue-gray"
            size="sm"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        )}
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-blue-gray-50">
          {warnings.map((warning, index) => (
            <div key={index} className="p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center gap-3">
                  {getSeverityIcon(warning.severity)}
                  <div>
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-semibold"
                      >
                        {warning.title}
                      </Typography>
                      <Chip
                        size="sm"
                        value={getSeverityLabel(warning.severity)}
                        color={getSeverityColor(warning.severity)}
                        className="rounded-full h-5"
                      />
                      {warning.count > 0 && (
                        <Chip
                          size="sm"
                          value={`${warning.count} 筆`}
                          variant="ghost"
                          className="rounded-full h-5"
                        />
                      )}
                    </div>
                    <Typography
                      variant="small"
                      className="text-blue-gray-500 mt-1"
                    >
                      {warning.message}
                    </Typography>
                  </div>
                </div>
                {warning.details && warning.details.length > 0 && (
                  <IconButton variant="text" size="sm">
                    {expandedItems[index] ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </IconButton>
                )}
              </div>

              {/* 展開的詳細資料 */}
              <Collapse open={expandedItems[index]}>
                {warning.details && warning.details.length > 0 && (
                  <div className="mt-3 ml-8 bg-blue-gray-50 rounded-lg p-3">
                    <table className="w-full min-w-max table-auto text-left">
                      <thead>
                        <tr>
                          {Object.keys(warning.details[0]).map((key) => (
                            <th
                              key={key}
                              className="border-b border-blue-gray-100 p-2"
                            >
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-medium text-xs uppercase"
                              >
                                {key}
                              </Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {warning.details.slice(0, 5).map((detail, idx) => (
                          <tr key={idx}>
                            {Object.values(detail).map((value, vIdx) => (
                              <td
                                key={vIdx}
                                className="border-b border-blue-gray-50 p-2"
                              >
                                <Typography
                                  variant="small"
                                  className="text-blue-gray-600 text-xs"
                                >
                                  {value ?? "-"}
                                </Typography>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {warning.details.length > 5 && (
                      <Typography
                        variant="small"
                        className="text-blue-gray-400 text-xs mt-2 text-center"
                      >
                        還有 {warning.details.length - 5} 筆資料...
                      </Typography>
                    )}
                  </div>
                )}
              </Collapse>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export default DataQualityCard;
