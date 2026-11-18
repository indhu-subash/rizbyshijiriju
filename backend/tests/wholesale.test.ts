import assert from 'node:assert/strict';
import { sanitizeText, validateEnquiryInput } from '../src/utils/wholesaleValidation';

const good = { fullName: ' Asha  Nair ', businessName: 'Asha <b>Jewels</b>', email: 'ASHA@Example.com', whatsappNumber: '+91 98765-43210', location: 'Kochi, Kerala', estimatedQuantity: '250', message: 'Hello <script>alert(1)</script>\n\n\n\nneed catalogue' };
const r = validateEnquiryInput(good);
assert.ok(r.data, JSON.stringify(r.errors));
assert.equal(r.data!.fullName, 'Asha Nair');
assert.equal(r.data!.businessName, 'Asha Jewels');
assert.equal(r.data!.email, 'asha@example.com');
assert.equal(r.data!.whatsappNumber, '+919876543210');
assert.equal(r.data!.estimatedQuantity, 250);
assert.ok(!/[<>]/.test(r.data!.message!), 'tags stripped');
assert.ok(!r.data!.message!.includes('\n\n\n'), 'newlines collapsed');

// invalid cases
const bad = validateEnquiryInput({ fullName: 'A', businessName: '', email: 'nope', whatsappNumber: '123', location: '', estimatedQuantity: '-5', message: '' });
assert.deepEqual(Object.keys(bad.errors!).sort(), ['businessName','email','estimatedQuantity','fullName','location','whatsappNumber']);
assert.ok(validateEnquiryInput({ ...good, estimatedQuantity: 2_000_000 }).errors!.estimatedQuantity);
assert.ok(validateEnquiryInput({ ...good, estimatedQuantity: '12.5' }).errors!.estimatedQuantity);
assert.ok(validateEnquiryInput({ ...good, estimatedQuantity: 'abc' }).errors!.estimatedQuantity);
assert.ok(validateEnquiryInput({ ...good, whatsappNumber: '+91 abc' }).errors!.whatsappNumber);
assert.equal(validateEnquiryInput({ ...good, message: '' }).data!.message, null);
assert.equal(sanitizeText({ evil: 1 } as any, 10), '');
assert.equal(sanitizeText('x'.repeat(500), 150).length, 150);
assert.ok(validateEnquiryInput(null as any).errors);
console.log('wholesale validation tests: ALL PASSED');
