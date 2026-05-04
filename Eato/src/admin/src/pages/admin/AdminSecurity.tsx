export default function AdminSecurity() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-stone-900">Security & access</h1>
      <p className="mb-6 text-sm text-stone-600">
        Eato uses role-based access. Only users authenticated as <strong>admin</strong> (JWT issued from admin login) can call{' '}
        <code className="rounded bg-stone-200 px-1 text-xs">/api/admin/*</code>. Customers and restaurants receive separate tokens and cannot access admin
        routes.
      </p>
      <ul className="list-inside list-disc space-y-2 text-sm text-stone-700">
        <li>
          Store JWTs securely; the admin app keeps the token in <code className="text-xs">localStorage</code> for this prototype.
        </li>
        <li>Deactivate customers or suspend restaurants from their respective admin pages to block platform use.</li>
        <li>Rejected restaurant registrations cannot log in until reinstated to approved or pending.</li>
        <li>Deleting users or restaurants is destructive; prefer suspend/block for policy enforcement when possible.</li>
      </ul>
    </div>
  );
}
