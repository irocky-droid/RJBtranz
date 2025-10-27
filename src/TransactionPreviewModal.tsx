import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, CheckCircle, Info } from '@phosphor-icons/react';

interface Transaction {
    id: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    exchangeRate: number;
    fee: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    createdAt: string;
}

interface TransactionPreviewModalProps {
    transaction: Transaction;
    onClose: () => void;
    onComplete: (transactionId: string) => void;
    onContinue: (data: {
        id: string;
        receiverData: {
            name: string;
            email: string;
            phone: string;
            receiverAmount: number;
        };
        editedRate: number;
    }) => void;
    onStatusUpdate: (transactionId: string, newStatus: Transaction['status']) => void;
}

const TransactionPreviewModal: React.FC<TransactionPreviewModalProps> = ({
    transaction,
    onClose,
    onComplete,
    onContinue,
}) => {
    const [step, setStep] = useState(1);
    const [receiverName, setReceiverName] = useState('');
    const [receiverEmail, setReceiverEmail] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [editedRate, setEditedRate] = useState<number>(1);

    useEffect(() => {
        // When the modal opens or transaction changes, set the initial rate.
        // If a specific currency is chosen, it will update. Otherwise, it defaults to 1.
        if (transaction) {
            setEditedRate(transaction.exchangeRate || 1);
        }
    }, [transaction]);

    const handleContinue = () => {
        const receiverAmount = transaction.amount * editedRate;
        onContinue({
            id: transaction.id,
            receiverData: {
                name: receiverName,
                email: receiverEmail,
                phone: receiverPhone,
                receiverAmount,
            },
            editedRate,
        });
        onClose();
    };

    const renderStep1 = () => (
        <>
            <CardHeader>
                <CardTitle>Transaction Preview</CardTitle>
                <CardDescription>Review the sender's details before proceeding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium">{transaction.clientName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Sent</span>
                    <span className="font-bold text-lg">{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: transaction.fromCurrency })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span>{transaction.fromCurrency}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span>{transaction.toCurrency}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge>{transaction.status}</Badge>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => setStep(2)}>
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </>
    );

    const renderStep2 = () => {
        const receiverAmount = transaction.amount * editedRate;

        return (
            <>
                <CardHeader>
                    <CardTitle>Receiver Information</CardTitle>
                    <CardDescription>Enter details for the money receiver.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="receiverName">Receiver Name</label>
                        <Input
                            id="receiverName"
                            placeholder="Full Name"
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="receiverEmail">Receiver Email</label>
                        <Input
                            id="receiverEmail"
                            type="email"
                            placeholder="email@example.com"
                            value={receiverEmail}
                            onChange={(e) => setReceiverEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="receiverPhone">Receiver Phone</label>
                        <Input
                            id="receiverPhone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={receiverPhone}
                            onChange={(e) => setReceiverPhone(e.target.value)}
                        />
                    </div>

                    {/* Editable Exchange Rate */}
                    <div className="space-y-2">
                        <label htmlFor="exchangeRate">Exchange Rate (1 {transaction.fromCurrency} to {transaction.toCurrency})</label>
                        <Input
                            id="exchangeRate"
                            type="number"
                            value={editedRate}
                            onChange={(e) => setEditedRate(parseFloat(e.target.value) || 0)}
                            step="0.0001"
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info size={14} />
                            Rate is now editable. It was automatically set to the current market rate.
                        </p>
                    </div>

                    <Card className="bg-muted/50 p-4">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Receiver Gets</span>
                            <span className="font-bold text-xl text-primary">
                                {receiverAmount.toLocaleString('en-US', { style: 'currency', currency: transaction.toCurrency })}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on the rate of {editedRate.toFixed(4)} per {transaction.fromCurrency}.
                        </p>
                    </Card>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button onClick={handleContinue} disabled={!receiverName}>
                            Update Transaction
                        </Button>
                    </div>
                </CardContent>
            </>
        );
    };

    const renderStep3 = () => (
        <>
            <CardHeader className="items-center text-center">
                <CheckCircle size={48} className="text-green-500" weight="fill" />
                <CardTitle>Transaction Ready</CardTitle>
                <CardDescription>This transaction is now ready to be completed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium">{transaction.clientName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Receiver</span>
                    <span className="font-medium">{receiverName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Sent</span>
                    <span className="font-bold">{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: transaction.fromCurrency })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Received</span>
                    <span className="font-bold text-primary">{(transaction.amount * editedRate).toLocaleString('en-US', { style: 'currency', currency: transaction.toCurrency })}</span>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={() => onComplete(transaction.id)} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Complete
                    </Button>
                </div>
            </CardContent>
        </>
    );

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <Card className="w-full max-w-lg">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </Card>
            </div>
        </div>
    );
};

export default TransactionPreviewModal;


const styles = `
.modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fadeIn 0.3s ease-out;
}

.modal-content {
    position: relative;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { transform: translateY(20px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);