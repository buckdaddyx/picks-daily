import { AdminUploadForm } from "@/components/admin-upload-form";

export const metadata = {
  title: "Picks Daily — Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminUploadForm />;
}
