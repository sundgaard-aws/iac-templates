Write-Output "Building Submit Function"
cd SubmitFunctionHandler
dotnet publish -o publish
cd publish
#7z a -sdel ../bin/drop.zip *
7z a ../bin/drop.zip *

cd ../..

Write-Output "Building JobStatus Function"
cd JobStatusFunctionHandler
dotnet publish -o publish
cd publish
7z a ../bin/drop.zip *

cd ../..

Write-Output "Building FinalizeJob Function"
cd FinalizeJobFunctionHandler
dotnet publish -o publish
cd publish
7z a ../bin/drop.zip *

cd ../..