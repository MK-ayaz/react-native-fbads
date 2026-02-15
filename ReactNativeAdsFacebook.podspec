require 'json'
package = JSON.parse(File.read(File.join(__dir__, './', 'package.json')))

Pod::Spec.new do |s|
  s.name          = 'ReactNativeAdsFacebook'
  s.version       = package['version']
  s.summary       = package['description']
  s.requires_arc  = true
  s.author        = { 'abhaynpai' => 'abhaypai2611@gmail.com' }
  s.license       = package['license']
  s.homepage      = package['homepage']
  s.source        = { :git => 'https://github.com/MK-ayaz/react-native-fbads', :tag => "v#{package['version']}" }
  s.platform      = :ios, '13.0'
  s.dependency    'React-Core'
  s.dependency    'FBAudienceNetwork', '~> 6.21'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17'
  }
  s.source_files  = 'ios/**/*.{h,m,mm}'
end
