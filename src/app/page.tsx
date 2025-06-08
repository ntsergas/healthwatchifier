import React from 'react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Hamilton CityGuide
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Navigate Hamilton municipal politics with confidence. Get clear, actionable information about the issues that matter to you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              What issue matters most to you?
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-2">
                  Select an issue:
                </label>
                <select 
                  id="issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose an issue...</option>
                  <option value="housing">Housing Affordability and Homelessness</option>
                  <option value="infrastructure">Infrastructure, Transit, and Road Safety</option>
                  <option value="governance">Municipal Governance and Transparency</option>
                  <option value="economy">Economic Recovery, Taxes, and City Services</option>
                  <option value="climate">Climate Change and Environmental Policy</option>
                  <option value="safety">Public Safety and Policing</option>
                </select>
              </div>

              <div>
                <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
                  Your ward:
                </label>
                <select 
                  id="ward"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose your ward...</option>
                  <option value="citywide">Citywide (Mayoral)</option>
                  <option value="ward1">Ward 1</option>
                  <option value="ward2">Ward 2</option>
                  <option value="ward3">Ward 3</option>
                  <option value="ward4">Ward 4</option>
                  <option value="ward5">Ward 5</option>
                  <option value="ward6">Ward 6</option>
                  <option value="ward7">Ward 7</option>
                  <option value="ward8">Ward 8</option>
                  <option value="ward9">Ward 9</option>
                  <option value="ward10">Ward 10</option>
                  <option value="ward11">Ward 11</option>
                  <option value="ward12">Ward 12</option>
                  <option value="ward13">Ward 13</option>
                  <option value="ward14">Ward 14</option>
                  <option value="ward15">Ward 15</option>
                </select>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-medium">
                Get Your Guide
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500">
            Preparing for Hamilton's 2026 municipal election
          </p>
        </div>
      </div>
    </div>
  )
} 