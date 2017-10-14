  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyC4at3TqxSEEl-kC9axR0DnUGTFeVmjZ-A",
    authDomain: "trainscheduler-3daf7.firebaseapp.com",
    databaseURL: "https://trainscheduler-3daf7.firebaseio.com",
    projectId: "trainscheduler-3daf7",
    storageBucket: "",
    messagingSenderId: "1035806124559"
  };
  firebase.initializeApp(config);


  var database = firebase.database();

  //Initialize variables
  var trainName = '';
  var trainDestination = '';
  var trainFirstArrivalTime = '';
  var trainFreq = 0;

  function displayTime() {
    var currDateTime = moment().format('MMM Do, YYYY hh:mm:ss A');
    $('#current-time').text(currDateTime);
  }

  function deleteTrain() {
    var trainNameDelete = $(this).attr("data-name");
    var query = database.ref().orderByChild("name").equalTo(trainNameDelete);
    query.on('child_added',function(snapshot){
      snapshot.ref.remove();
    });

    $(this).parent().prevAll().parent().remove();

  }

  function editTrain() {

    //Change the form to edit train
    $('#update').show();
    $('#submit').hide();
    $(".add-update-panel").text("Update train details");
    /*  change panel */

    //Get the location of data to be edited.
    var trainNameEdit = $(this).attr("data-name");
    var query = database.ref().orderByChild("name").equalTo(trainNameEdit);

    //Assign attribute for 'update button' in the form for future reference
    $('#update').attr("data-name",trainNameEdit);

    //Retrieve corresponding value from database and display on form to edit
    query.on('child_added',function(snapshot) {
        var trainNameDB = snapshot.val().name;
        var trainDestinationDB = snapshot.val().destination;
        var firstArrivalDB = snapshot.val().firstArrival;
        var frequencyDB = snapshot.val().frequency;

        $("#nameInput").val(trainNameDB);
        $("#destinationInput").val(trainDestinationDB);
        $("#firstArrivalInput").val(firstArrivalDB);
        $("#frequencyInput").val(frequencyDB);

    });

  }

$("#update").hide();


//Display schedule by calculating the data
function timedSchedule(){

  $("tbody").empty();

  // Firebase watcher + initial loader.
  database.ref().on("child_added", function(childSnapshot) {

    //Retriving records from database and assingning to variables
    trainName = childSnapshot.val().name;
    trainDestination = childSnapshot.val().destination;
    trainFirstArrivalTime = childSnapshot.val().firstArrival;  
    trainFreq = childSnapshot.val().frequency;
    
    var tFrequency = parseInt(trainFreq);

     // First Time (pushed back 1 year to make sure it comes before current time)
      var firstTimeConverted = moment(trainFirstArrivalTime, "hh:mm").subtract(1, "years");
   
      // Difference between the times & Time apart (remainder)
      var diffTime = moment().diff(moment(firstTimeConverted), "minutes");
      var tRemainder = diffTime % tFrequency;

      // Minute Until Train
      var nextTrainInMinute = tFrequency - tRemainder;

      // Next Train
      var nextTrain = moment().add(nextTrainInMinute, "minutes");
      var nextTrainArrival = moment(nextTrain).format("hh:mm");

      // Buttons for delete and edit
      var deleteButton = "<span data-name ='" + trainName + "' class='label label-success delete'>Delete</span>";
      var editButton = "<span data-name ='" + trainName + "' class='label label-success edit'>Update</span>";

         $("tbody").append("<tr><td class='camel-case'>"
          + trainName + "</td><td class='camel-case'>" 
          + trainDestination + "</td><td>" 
          + trainFreq + "</td><td>" 
          + nextTrainArrival + "</td><td>" 
          + nextTrainInMinute + "</td><td>"
          + editButton + "</td><td>"
          + deleteButton +"</td></tr>"); 

        }, function(errorObject) {
                console.log("Errors handled: " + errorObject.code);
            
  });
}


// Realtime time format validaton.
$("input").on("input",function(){
      var is_value = $(this).val();
      if(is_value){
          $(this).next().hide();
      } else{
          $(this).next().show().text("This field is required");
      }
});

$("#firstArrivalInput").on("input",function(){
    var is_time = $(this).val();
    var valid = moment(is_time, "HH:mm", true).isValid();
    if(!valid)
        $(this).next().show().text("Enter time in valid format");
});



//When Submit Button is clicked -- Collect values to update Firebase
  $('#submit').on('click',function(){

    event.preventDefault();

    var trainName = $('#nameInput').val().trim();
    var trainDestination = $('#destinationInput').val().trim();
    var trainFirstArrivalTime = $('#firstArrivalInput').val().trim();
    var trainFreq = parseInt($('#frequencyInput').val().trim());
    var inputValid=true;

    //Input field Validations
    
    // Check for 5 digits and colon in the right place
    if(trainFirstArrivalTime.length != 5 || trainFirstArrivalTime.substring(2,3) != ":"){
        inputValid=false;
         $("#firstArrivalInput").next().show().text("Please use Military Time. Example: 01:00 or 13:00");
    }
    // Check for that Numbers are to the left and right of the semi-colon
    if( isNaN(parseInt(trainFirstArrivalTime.substring(0, 2))) || isNaN(parseInt(trainFirstArrivalTime.substring(3))) ){
        inputValid=false;
         $("#firstArrivalInput").next().show().text("Please use Military Time. Example: 01:00 or 13:00");
    }

    if( parseInt(trainFirstArrivalTime.substring(0, 2)) < 0 || parseInt(trainFirstArrivalTime.substring(0, 2)) > 23 ) {
        inputValid=false;
        $("#firstArrivalInput").next().show().text("Please use Military Time. Example: 01:00 or 13:00");
    }
    
    if (parseInt(trainFirstArrivalTime.substring(3)) < 0 || parseInt(trainFirstArrivalTime.substring(3)) > 59 ) {
        inputValid=false;
        $("#firstArrivalInput").next().show().text("Enter time in valid format HH:MM");
    }
    //Push data to Firebase 
    if (trainName && trainDestination && trainFirstArrivalTime && trainFreq && inputValid){

          database.ref().push({
            name : trainName,
            destination : trainDestination,
            firstArrival : trainFirstArrivalTime,
            frequency : trainFreq
          });

          //Hide empty field error message
          $("#nameInput").next().hide();  
          $("#destinationInput").next().hide();
          $("#firstArrivalInput").next().hide();
          $("#frequencyInput").next().hide();          


          //Clear Input fields after successful submission
          $('#form-train')[0].reset();
          
          //console.log('record added');
          //Update table
          timedSchedule();
    }

    else {
      if(!trainName)
          $("#nameInput").next().show().text("This field is required");
      if(!trainDestination)
          $("#destinationInput").next().show().text("This field is required");
      if(!trainFirstArrivalTime)
          $("#firstArrivalInput").next().show().text("This field is required");
      if(!trainFreq)
          $("#frequencyInput").next().show().text("This field is required");
    }

  });

//When update button is clicked update database with values from the form
$('#update').on('click', function(event){
    event.preventDefault();

    //Get values from the form
    var nameUpdate = $("#nameInput").val().trim();
    var destinationUpdate = $("#destinationInput").val().trim();
    var firstArrivalUpdate = $("#firstArrivalInput").val().trim();
    var freqUpdate = $("#frequencyInput").val().trim();

    var trainToUpdate = $(this).attr('data-name');
    var query = database.ref().orderByChild('name').equalTo(trainToUpdate);

      query.on('child_added',function(snapshot){

        snapshot.ref.update({
          name:nameUpdate,
          destination:destinationUpdate,
          firstArrival:firstArrivalUpdate,
          frequency:freqUpdate

        });
      });

      $('#form-train')[0].reset();

      //Update Display
      timedSchedule();

      //Change form to add train
      $("#update").hide();
      $("#submit").show();
      $(".add-update-panel").text("Add train");
});

//Prevent submitting form on pressing enter key
$(window).keydown(function(event){
    if(event.keyCode == 13) {
      event.preventDefault();
      return false;
    }
});
  //When Delete button clicked, call delete train function
    $(document).on('click','.delete',deleteTrain);

  //When Update button clicked, call edit train function
    $(document).on('click','.edit',editTrain);

  // Display Current time & date.
    setInterval(displayTime, 1000);

  // Display first set of data from database
    timedSchedule();

  //Update schedule table at every 15 seconds
    setInterval(timedSchedule, 1000*15);
