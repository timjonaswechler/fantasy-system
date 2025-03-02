// src/app/users/page.tsx
import { getUsers, createUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UsersPage() {
  // Daten von Server Action laden
  const users = await getUsers();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Benutzerverwaltung</h1>

      {/* Formular zum Erstellen eines neuen Benutzers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Neuen Benutzer erstellen</CardTitle>
          <CardDescription>
            Füge einen neuen Benutzer zur Datenbank hinzu
          </CardDescription>
        </CardHeader>
        <form
          action={async (formData: FormData) => {
            await createUser(formData);
          }}
        >
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Name eingeben"
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-Mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="E-Mail eingeben"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Benutzer erstellen</Button>
          </CardFooter>
        </form>
      </Card>

      {/* Tabelle mit Benutzerdaten */}
      <Card>
        <CardHeader>
          <CardTitle>Benutzerliste</CardTitle>
          <CardDescription>Alle Benutzer in der Datenbank</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Liste aller registrierten Benutzer</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Keine Benutzer gefunden
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/users/${user.id}`}>Bearbeiten</a>
                        </Button>
                        <form
                          action={async () => {
                            "use server";
                            const { deleteUser } = await import(
                              "@/actions/users"
                            );
                            await deleteUser(user.id);
                          }}
                        >
                          <Button variant="destructive" size="sm" type="submit">
                            Löschen
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
