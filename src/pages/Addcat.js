import { React, useEffect,useState } from "react";
import firebase from 'firebase/compat/app';
import { db } from "./firebaase.js";
import CustomInput from "../components/CustomInput";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";

let schema = yup.object().shape({
  title: yup.string().required("Category Name is Required"),
});
const Addcat = () => {
  const location = useLocation();
  const getPCatId = location.pathname.split("/")[3];
  const navigate = useNavigate();
  const [error, setError] = useState('');
 
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: "",
    },
    validationSchema: schema,
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formik.values.title.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    const categorySnapshot = await db.collection('categories').get();
      const categoryCount = categorySnapshot.size + 1;
      const categoryId = `Category${categoryCount}`;


    try {
      await db.collection('categories').doc(categoryId).set({
        id:categoryId,
        name: formik.values.title,
      });
      toast.success("Category Added Successfullly!");
      console.log('Category added successfully!');
    } catch (error) {
      toast.error("Something Went Wrong!");
      console.error('Error adding category: ', error);
    }
  };

  return (
    <div>
      <h3 className="mb-4  title">
        {getPCatId !== undefined ? "Edit" : "Add"} Category
      </h3>
      <div>
        <form action="" onSubmit={handleFormSubmit}>
          <CustomInput
            type="text"
            label="Enter Product Category"
            onChng={formik.handleChange("title")}
            onBlr={formik.handleBlur("title")}
            val={formik.values.title}
            id="brand"
          />
          <div className="error">
            {formik.touched.title && formik.errors.title}
          </div>
          <button
            className="btn btn-success border-0 rounded-3 my-5"
            type="submit"
          >
            {getPCatId !== undefined ? "Edit" : "Add"} Category
          </button>
        </form>
      </div>
    </div>
  );
};

export default Addcat;
