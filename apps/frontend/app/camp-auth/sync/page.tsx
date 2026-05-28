export default function CampAuthSync({
  searchParams,
}: {
  searchParams?: { client_id?: string; user_id?: string };
}) {
  const client_id = searchParams?.client_id;
  const userId = searchParams?.user_id;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Camp Auth (disabled)</h1>
        <p className="mt-2 text-sm text-gray-600">
          This route is intentionally disabled for now so deployments succeed. Re-enable it when
          `@campnetwork/origin` is installed and configured.
        </p>

        {(client_id || userId) && (
          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-left text-xs text-gray-700">
            {client_id && (
              <p>
                <span className="font-semibold">client_id</span>: {client_id}
              </p>
            )}
            {userId && (
              <p className="mt-1">
                <span className="font-semibold">user_id</span>: {userId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}