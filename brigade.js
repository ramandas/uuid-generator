const { events, Job, Group } = require('brigadier')

// registering checks
const project = {
  name: "unit"
}

events.on("push", (e, project) => {
  console.log("Starting brigade")
  console.log(project.name)

  // creating a unit test application job
  var unitTest = new Job("unit-test", "python:3")
  unitTest.tasks = [
    "cd /src/",
    "pip install -r requirements.txt",
    "cd /src/",
    "python setup.py test"
  ]
  const dockerBuild = new Job("dockerbuild")
  dockerBuild.image = "docker:dind"
  dockerBuild.privileged = true;

  dockerBuild.env = {
    DOCKER_DRIVER: "overlay"
  }

  dockerBuild.env.DOCKER_USER = project.secrets.dockerLogin
  dockerBuild.env.DOCKER_PASS = project.secrets.dockerPass

  dockerBuild.tasks = [
    "dockerd-entrypoint.sh &",
    "sleep 20",
    "cd /src/",
    "docker build -t ramandas/brigade-test:latest .",
    "docker login -u $DOCKER_USER -p $DOCKER_PASS",
    "docker push ramandas/brigade-test:latest"
  ]

  const pipeline = new Group()
  pipeline.add(unitTest)
  //pipeline.add(dockerBuild)
  pipeline.runAll()

})
