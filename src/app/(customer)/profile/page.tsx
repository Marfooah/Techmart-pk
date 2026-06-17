import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateProfileAction } from "@/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user?.customerId) return <p>Customer profile required.</p>;

  const customer = await prisma.customer.findUnique({
    where: { id: user.customerId },
    include: { user: true },
  });

  if (!customer) return <p>Profile not found.</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfileAction} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={customer.user.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={customer.user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={customer.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Address</Label>
              <Input
                id="shippingAddress"
                name="shippingAddress"
                defaultValue={customer.shippingAddress || ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={customer.city || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input id="province" name="province" defaultValue={customer.province || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" name="postalCode" defaultValue={customer.postalCode || ""} />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
