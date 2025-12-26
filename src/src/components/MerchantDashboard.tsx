import { useMemo, useState } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI, IS_CONTRACT_CONFIGURED } from '../config/contracts';
import '../styles/MerchantDashboard.css';

type DecryptedPurchase = {
  quantity: string;
  price: string;
};

export function MerchantDashboard() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [decryptedById, setDecryptedById] = useState<Record<string, DecryptedPurchase>>({});
  const [decryptingId, setDecryptingId] = useState<string>('');
  const [decryptError, setDecryptError] = useState<string>('');

  const { data: shopAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'shop',
    query: { enabled: IS_CONTRACT_CONFIGURED },
  });

  const isShop = useMemo(() => {
    if (!address || !shopAddress) return false;
    return address.toLowerCase() === (shopAddress as string).toLowerCase();
  }, [address, shopAddress]);

  const { data: count } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPurchaseCount',
    query: { enabled: IS_CONTRACT_CONFIGURED },
  });

  const purchaseCount = useMemo(() => {
    if (typeof count === 'bigint') return Number(count);
    return 0;
  }, [count]);

  const purchaseIds = useMemo(() => {
    const safeCount = Number.isFinite(purchaseCount) ? Math.max(0, Math.min(purchaseCount, 100)) : 0;
    return Array.from({ length: safeCount }, (_, i) => BigInt(i));
  }, [purchaseCount]);

  const { data: purchasesData, isLoading: purchasesLoading } = useReadContracts({
    contracts: purchaseIds.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getPurchase',
      args: [id],
    })),
    query: {
      enabled: IS_CONTRACT_CONFIGURED && purchaseIds.length > 0,
    },
  });

  const purchases = useMemo(() => {
    if (!purchasesData) return [];
    return purchasesData
      .map((item, index) => ({
        id: purchaseIds[index],
        item,
      }))
      .filter((x) => x.item.status === 'success')
      .map((x) => {
        const result: any = x.item.result;
        return {
          id: x.id,
          buyer: result.buyer as string,
          buyerName: result.buyerName as string,
          productName: result.productName as string,
          quantityHandle: result.quantity as string,
          priceHandle: result.price as string,
          timestamp: result.timestamp as bigint,
        };
      })
      .reverse();
  }, [purchasesData, purchaseIds]);

  const decryptPurchase = async (purchaseId: bigint, quantityHandle: string, priceHandle: string) => {
    setDecryptError('');
    if (!isShop) {
      setDecryptError('Only the shop wallet can decrypt purchase details.');
      return;
    }
    if (!address || !instance || !signerPromise) {
      setDecryptError('Missing wallet connection, signer, or encryption service.');
      return;
    }

    const idKey = purchaseId.toString();
    setDecryptingId(idKey);

    try {
      const signer = await signerPromise;
      const keypair = instance.generateKeypair();

      const handleContractPairs = [
        { handle: quantityHandle, contractAddress: CONTRACT_ADDRESS },
        { handle: priceHandle, contractAddress: CONTRACT_ADDRESS },
      ];

      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [CONTRACT_ADDRESS];

      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );

      const quantity = result[quantityHandle] ?? '';
      const price = result[priceHandle] ?? '';

      setDecryptedById((prev) => ({
        ...prev,
        [idKey]: { quantity: String(quantity), price: String(price) },
      }));
    } catch (err) {
      console.error(err);
      setDecryptError(err instanceof Error ? err.message : 'Failed to decrypt purchase.');
    } finally {
      setDecryptingId('');
    }
  };

  return (
    <div className="merchant-container">
      <div className="merchant-card">
        <div className="merchant-header">
          <h2 className="merchant-title">Purchases</h2>
          <div className="merchant-meta">
            <div>
              <span className="meta-label">Contract</span>
              <span className="mono">{CONTRACT_ADDRESS}</span>
            </div>
            <div>
              <span className="meta-label">Shop</span>
              <span className="mono">{shopAddress ? String(shopAddress) : '...'}</span>
            </div>
          </div>
        </div>

        {zamaError && <div className="alert error">Encryption service error: {zamaError}</div>}
        {!IS_CONTRACT_CONFIGURED && (
          <div className="alert error">
            Set the deployed contract address in <span className="mono">src/src/config/contracts.ts</span>.
          </div>
        )}
        {!address && <div className="alert info">Connect your wallet to view purchases.</div>}
        {address && !isShop && (
          <div className="alert warn">
            You can view purchase metadata, but only the shop wallet can decrypt quantity and price.
          </div>
        )}
        {decryptError && <div className="alert error">{decryptError}</div>}

        <div className="summary-row">
          <div className="summary-item">
            <span className="meta-label">Total</span>
            <span className="summary-value">{purchaseCount}</span>
          </div>
          <div className="summary-item">
            <span className="meta-label">Decryption</span>
            <span className="summary-value">{zamaLoading ? 'Initializing...' : isShop ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        {purchasesLoading && <div className="loading">Loading purchases...</div>}

        {purchaseCount === 0 && !purchasesLoading && (
          <div className="empty-state">No purchases recorded yet.</div>
        )}

        <div className="purchase-list">
          {purchases.map((p) => {
            const decrypted = decryptedById[p.id.toString()];
            return (
              <div key={p.id.toString()} className="purchase-item">
                <div className="purchase-top">
                  <div className="purchase-main">
                    <div className="purchase-title-row">
                      <span className="purchase-name">{p.productName}</span>
                      <span className="purchase-id">#{p.id.toString()}</span>
                    </div>
                    <div className="purchase-sub">
                      <span className="sub-label">Buyer</span> {p.buyerName} <span className="mono">{p.buyer}</span>
                    </div>
                    <div className="purchase-sub">
                      <span className="sub-label">Time</span>{' '}
                      {new Date(Number(p.timestamp) * 1000).toLocaleString()}
                    </div>
                  </div>

                  <div className="purchase-actions">
                    {isShop && (
                      <button
                        className="secondary-button"
                        onClick={() => decryptPurchase(p.id, p.quantityHandle, p.priceHandle)}
                        disabled={decryptingId === p.id.toString() || zamaLoading}
                      >
                        {decryptingId === p.id.toString() ? 'Decrypting...' : 'Decrypt'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="purchase-details">
                  <div className="detail">
                    <span className="detail-label">Quantity</span>
                    <span className="detail-value">{decrypted ? decrypted.quantity : 'Encrypted'}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Price</span>
                    <span className="detail-value">{decrypted ? decrypted.price : 'Encrypted'}</span>
                  </div>
                </div>

                <div className="handles">
                  <div className="handle-row">
                    <span className="handle-label">quantity handle</span>
                    <span className="mono">{p.quantityHandle}</span>
                  </div>
                  <div className="handle-row">
                    <span className="handle-label">price handle</span>
                    <span className="mono">{p.priceHandle}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
