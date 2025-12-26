import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI, IS_CONTRACT_CONFIGURED } from '../config/contracts';
import '../styles/PurchaseForm.css';

type FormState = {
  buyerName: string;
  productName: string;
  quantity: string;
  price: string;
};

function parseUint32(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < 0 || parsed > 0xffffffff) return null;
  return parsed;
}

export function PurchaseForm() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [form, setForm] = useState<FormState>({
    buyerName: '',
    productName: '',
    quantity: '',
    price: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const quantityParsed = useMemo(() => parseUint32(form.quantity), [form.quantity]);
  const priceParsed = useMemo(() => parseUint32(form.price), [form.price]);

  const canSubmit =
    !!address &&
    !!instance &&
    !!signerPromise &&
    IS_CONTRACT_CONFIGURED &&
    form.buyerName.trim().length > 0 &&
    form.productName.trim().length > 0 &&
    quantityParsed !== null &&
    priceParsed !== null &&
    !zamaLoading &&
    !isSubmitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setTxHash('');

    if (!address) {
      setSubmitError('Connect your wallet first.');
      return;
    }
    if (!IS_CONTRACT_CONFIGURED) {
      setSubmitError('Contract address is not configured yet.');
      return;
    }
    if (!instance || !signerPromise) {
      setSubmitError('Encryption service or signer is not ready yet.');
      return;
    }
    if (quantityParsed === null || priceParsed === null) {
      setSubmitError('Quantity and price must be valid uint32 integers.');
      return;
    }

    setIsSubmitting(true);
    try {
      const encryptedInput = await instance
        .createEncryptedInput(CONTRACT_ADDRESS, address)
        .add32(quantityParsed)
        .add32(priceParsed)
        .encrypt();

      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.recordPurchase(
        form.buyerName.trim(),
        form.productName.trim(),
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof,
      );

      setTxHash(tx.hash);
      await tx.wait();

      setForm({ buyerName: '', productName: '', quantity: '', price: '' });
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="purchase-form-container">
      <div className="purchase-card">
        <h2 className="purchase-title">Record a Purchase</h2>

        {zamaError && <div className="alert error">Encryption service error: {zamaError}</div>}
        {!IS_CONTRACT_CONFIGURED && (
          <div className="alert error">
            Set the deployed contract address in <span className="mono">src/src/config/contracts.ts</span>.
          </div>
        )}
        {!address && <div className="alert info">Connect your wallet to record a purchase.</div>}

        <form onSubmit={onSubmit} className="purchase-form">
          <div className="form-row">
            <label className="label">Buyer Name</label>
            <input
              className="input"
              value={form.buyerName}
              onChange={(e) => setForm((s) => ({ ...s, buyerName: e.target.value }))}
              placeholder="e.g., Alice"
              required
            />
          </div>

          <div className="form-row">
            <label className="label">Product Name</label>
            <input
              className="input"
              value={form.productName}
              onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))}
              placeholder="e.g., Apple"
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label className="label">Quantity (encrypted)</label>
              <input
                className="input"
                value={form.quantity}
                onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
                placeholder="e.g., 2"
                inputMode="numeric"
                required
              />
            </div>
            <div className="form-row">
              <label className="label">Price (encrypted)</label>
              <input
                className="input"
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                placeholder="e.g., 10"
                inputMode="numeric"
                required
              />
            </div>
          </div>

          <button className="primary-button" type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Submitting...' : zamaLoading ? 'Initializing encryption...' : 'Submit'}
          </button>

          {txHash && (
            <div className="alert success">
              Transaction: <span className="mono">{txHash}</span>
            </div>
          )}
          {submitError && <div className="alert error">{submitError}</div>}
        </form>
      </div>
    </div>
  );
}
