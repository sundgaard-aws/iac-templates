dotnet publish -o publish
cd publish
7z a -sdel ../bin/drop.zip *
cd ..