// frontend/src/components/pos/Receipt.jsx
import React from 'react';
import { format } from 'date-fns';

const Receipt = React.forwardRef(({ transaction, pharmacyInfo }, ref) => {
  const pharmacy = pharmacyInfo || {
    name: 'PHARMA INVENTORY STORE',
    address: '123 Pharmacy Road, Lagos, Nigeria',
    phone: '+234 801 234 5678',
    email: 'info@pharmainventory.com',
    vatNumber: 'VAT-12345678-01',
    rcNumber: 'RC-1234567'
  };
  
  if (!transaction) return null;
  
  const subtotal = transaction.subtotal || transaction.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const vat = transaction.vat || subtotal * 0.075;
  const total = transaction.totalAmount || subtotal + vat;
  
  return (
    <div ref={ref} className="p-4 bg-white" style={{ width: '300px', fontFamily: "'Courier New', monospace" }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="font-bold text-lg uppercase">{pharmacy.name}</h3>
        <p className="text-xs">{pharmacy.address}</p>
        <p className="text-xs">Tel: {pharmacy.phone}</p>
        <p className="text-xs">Email: {pharmacy.email}</p>
        <div className="border-t border-dotted border-gray-300 my-2"></div>
        <p className="text-xs">VAT No: {pharmacy.vatNumber}</p>
        <p className="text-xs">RC No: {pharmacy.rcNumber}</p>
        <div className="border-t border-dotted border-gray-300 my-2"></div>
      </div>
      
      {/* Receipt Info */}
      <div className="mb-4 text-xs">
        <div className="flex justify-between">
          <span>Receipt No:</span>
          <span className="font-bold">{transaction.receiptNumber || `RCPT${Date.now()}`}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Transaction ID:</span>
          <span>{transaction.transactionId || `TRX${Date.now()}`}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Date:</span>
          <span>{format(new Date(transaction.createdAt || Date.now()), 'dd/MM/yyyy')}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Time:</span>
          <span>{format(new Date(transaction.createdAt || Date.now()), 'hh:mm:ss a')}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>POS Agent:</span>
          <span>{transaction.posAgentId?.name || 'Agent'}</span>
        </div>
        <div className="border-t border-dotted border-gray-300 my-2"></div>
      </div>
      
      {/* Items Header */}
      <div className="mb-2">
        <div className="grid grid-cols-4 gap-1 text-xs font-bold border-b border-gray-300 pb-1">
          <div className="col-span-2">Item</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Price</div>
        </div>
      </div>
      
      {/* Items */}
      <div className="mb-4 space-y-2">
        {transaction.items.map((item, idx) => (
          <div key={idx} className="text-xs">
            <div className="font-medium">{item.productName}</div>
            <div className="grid grid-cols-4 gap-1 text-gray-600 ml-2">
              <div className="col-span-2">
                {item.quantityPacks > 0 && `${item.quantityPacks} pack(s)`}
                {item.quantityPacks > 0 && item.quantityUnits > 0 && ' + '}
                {item.quantityUnits > 0 && `${item.quantityUnits} unit(s)`}
              </div>
              <div className="text-right">
                ₦{(item.unitPrice || (item.totalPrice / (item.quantityPacks + item.quantityUnits))).toLocaleString()}
              </div>
              <div className="text-right font-medium">
                ₦{item.totalPrice.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Totals */}
      <div className="border-t border-dotted border-gray-300 pt-2 mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span>Subtotal:</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span>VAT (7.5%):</span>
          <span>₦{vat.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm font-bold mt-2 pt-1 border-t border-dotted">
          <span>TOTAL:</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Payment Info */}
      <div className="mb-4 text-xs">
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span className="uppercase font-bold">{transaction.paymentMethod || 'CASH'}</span>
        </div>
        {transaction.paymentReference && (
          <div className="flex justify-between mt-1">
            <span>Ref No:</span>
            <span>{transaction.paymentReference}</span>
          </div>
        )}
        <div className="flex justify-between mt-1">
          <span>Status:</span>
          <span className="text-green-600 font-bold">COMPLETED</span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center border-t border-dotted border-gray-300 pt-3">
        <p className="text-xs font-semibold">THANK YOU FOR YOUR PATRONAGE!</p>
        <p className="text-xs mt-1">Goods sold are not returnable</p>
        <p className="text-xs">Please keep receipt for warranty</p>
        <div className="border-t border-dotted border-gray-300 my-2"></div>
        <p className="text-xs">This is a computer generated receipt</p>
        <p className="text-xs">Valid without signature</p>
        <div className="mt-2">
          <div className="inline-block border-t border-gray-400 w-32"></div>
          <p className="text-xs mt-1">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;