package com.example.pongphonadroidd

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Spinner
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.bottomnavigation.BottomNavigationView
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.Response
import java.io.File
import java.io.IOException
import java.io.InputStream
import java.util.UUID

class MainActivity2 : AppCompatActivity() {

    private val brands = listOf("none", "Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Audi", "Mercedes-Benz", "Nissan", "Volkswagen", "Hyundai", "Kia", "Mazda", "Subaru", "Porsche", "Land Rover", "Jaguar", "Lexus", "Infinity", "Buick", "Chrysler", "Genesis", "Tesla")
    private val years = listOf("none", "2020", "2021", "2022", "2023", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010", "2009", "2008", "2007", "2006", "2005")
    private val colors = listOf("none", "Red", "Blue", "Green", "Black", "White", "Silver", "Gray", "Orange", "Purple", "Yellow", "Brown", "Beige", "Turquoise", "Teal", "Pink", "Maroon", "Copper", "Bronze", "Champagne")
    private val transmissions = listOf("none", "Automatic", "Manual", "CVT", "Dual-clutch", "Semi-automatic", "Continuously Variable", "Robotized Manual")
    private val fuels = listOf("none", "Petrol", "Diesel", "Electric", "Hybrid", "LPG", "CNG", "E85", "Hydrogen", "Biofuel")
    private val doors = listOf("none", "2", "4", "5", "3", "6", "7")
    private val seats = listOf("none", "2", "4", "5", "7", "6", "8", "9", "10", "11", "12", "13")

    private var carImageUri: Uri? = null
    private lateinit var selectImageLauncher: ActivityResultLauncher<Intent>

    @SuppressLint("MissingInflatedId")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main2)

        // Set up spinners
        setupSpinners()

        // Set up bottom navigation
        val bottomNavigationView = findViewById<BottomNavigationView>(R.id.bottomNavigationView)
        bottomNavigationView.setOnNavigationItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_view -> {
                    startActivity(Intent(this, MainActivity::class.java))
                    true
                }
                R.id.navigation_add_car -> {
                    startActivity(Intent(this, MainActivity2::class.java))
                    true
                }
                else -> false
            }
        }

        // Image selection setup
        val selectImageButton = findViewById<Button>(R.id.btnSelectImage)
        selectImageButton.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
            selectImageLauncher.launch(intent)
        }

        selectImageLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == RESULT_OK && result.data?.data != null) {
                carImageUri = result.data?.data
                carImageUri?.let {
                    try {
                        val inputStream: InputStream? = contentResolver.openInputStream(it)
                        val bitmap = BitmapFactory.decodeStream(inputStream)
                        findViewById<ImageView>(R.id.imgCar).setImageBitmap(bitmap)
                    } catch (e: IOException) {
                        Log.e("ImageError", "Error loading image", e)
                    }
                }
            }
        }

        // Add car data button
        val addButton = findViewById<Button>(R.id.button2)
        addButton.setOnClickListener {
            validateAndSubmitForm()

        }
    }

    private fun setupSpinners() {
        val spinnerBrand = findViewById<Spinner>(R.id.spinnerBrand)
        val spinnerYear = findViewById<Spinner>(R.id.spinnerYear)
        val spinnerColor = findViewById<Spinner>(R.id.spinnerColor)
        val spinnerTransmission = findViewById<Spinner>(R.id.spinnerTransmission)
        val spinnerFuelType = findViewById<Spinner>(R.id.spinnerFuelType)
        val spinnerDoors = findViewById<Spinner>(R.id.spinnerDoors)
        val spinnerSeats = findViewById<Spinner>(R.id.spinnerSeats)

        val adapters = mapOf(
            spinnerBrand to brands,
            spinnerYear to years,
            spinnerColor to colors,
            spinnerTransmission to transmissions,
            spinnerFuelType to fuels,
            spinnerDoors to doors,
            spinnerSeats to seats
        )

        adapters.forEach { (spinner, items) ->
            val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, items)
            adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            spinner.adapter = adapter
            spinner.setSelection(0) // Set "None" as the default selection
        }
    }

    private fun validateAndSubmitForm() {
        val spinnerBrand = findViewById<Spinner>(R.id.spinnerBrand)
        val spinnerYear = findViewById<Spinner>(R.id.spinnerYear)
        val spinnerColor = findViewById<Spinner>(R.id.spinnerColor)
        val spinnerTransmission = findViewById<Spinner>(R.id.spinnerTransmission)
        val spinnerFuelType = findViewById<Spinner>(R.id.spinnerFuelType)
        val spinnerDoors = findViewById<Spinner>(R.id.spinnerDoors)
        val spinnerSeats = findViewById<Spinner>(R.id.spinnerSeats)
        val editTextModel = findViewById<EditText>(R.id.txtmodel)
        val editTextPrice = findViewById<EditText>(R.id.txtprice)

        val brand = spinnerBrand.selectedItem.toString()
        val year = spinnerYear.selectedItem.toString()
        val color = spinnerColor.selectedItem.toString()
        val transmission = spinnerTransmission.selectedItem.toString()
        val fuelType = spinnerFuelType.selectedItem.toString()
        val doors = spinnerDoors.selectedItem.toString()
        val seats = spinnerSeats.selectedItem.toString()
        val model = editTextModel.text.toString()
        val price = editTextPrice.text.toString()

        if (brand == "none" || year == "none" || color == "none" ||
            transmission == "none" || fuelType == "none" ||
            doors == "none" || seats == "none" || model.isEmpty() || price.isEmpty()) {
            Toast.makeText(this, "Please fill in all required fields", Toast.LENGTH_SHORT).show()
            return
        }

        if(price.toInt() <= 0){
            Toast.makeText(this, "Price must be greater than 0", Toast.LENGTH_SHORT).show()
        }

        // Handle image
        val file: File? = carImageUri?.let {
            try {
                val inputStream = contentResolver.openInputStream(it)
                val uniqueFileName = "car_image_${UUID.randomUUID()}.jpg"
                val file = File(cacheDir, uniqueFileName)
                file.outputStream().use { outputStream -> inputStream?.copyTo(outputStream) }
                file
            } catch (e: IOException) {
                Log.e("FileError", "Error saving image file", e)
                null
            }
        }

        if (file == null) {
            Toast.makeText(this, "Please select an image", Toast.LENGTH_SHORT).show()
            return
        }

        // Prepare data for API request
        val client = OkHttpClient()
        val requestBody = MultipartBody.Builder().setType(MultipartBody.FORM)
            .addFormDataPart("Brand", brand)
            .addFormDataPart("Model", model)
            .addFormDataPart("Year", year)
            .addFormDataPart("Color", color)
            .addFormDataPart("Price", price)
            .addFormDataPart("TransmissionType", transmission)
            .addFormDataPart("FuelType", fuelType)
            .addFormDataPart("NumberOfDoors", doors)
            .addFormDataPart("NumberOfSeats", seats)
            .addFormDataPart("CarImage", file.name, file.asRequestBody("image/jpeg".toMediaTypeOrNull()))
            .build()
        Log.d("RequestBody", requestBody.toString())
        val url = getString(R.string.root_url) + getString(R.string.insertdata)
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        // Make API request
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    Toast.makeText(this@MainActivity2, "Failed to submit data with error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                runOnUiThread {
                    if (response.isSuccessful) {
                        Toast.makeText(this@MainActivity2, "Data submitted successfully", Toast.LENGTH_SHORT).show()
                        val intent = Intent(this@MainActivity2, MainActivity::class.java)
                        startActivity(intent)
                    } else {
                        Toast.makeText(this@MainActivity2, "Failed to submit data", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        })
    }
}
