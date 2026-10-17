// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ai_draft_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AiDraftResponseModel {

 String get draftSubject; String get draftBody; double get confidenceScore;
/// Create a copy of AiDraftResponseModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AiDraftResponseModelCopyWith<AiDraftResponseModel> get copyWith => _$AiDraftResponseModelCopyWithImpl<AiDraftResponseModel>(this as AiDraftResponseModel, _$identity);

  /// Serializes this AiDraftResponseModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AiDraftResponseModel&&(identical(other.draftSubject, draftSubject) || other.draftSubject == draftSubject)&&(identical(other.draftBody, draftBody) || other.draftBody == draftBody)&&(identical(other.confidenceScore, confidenceScore) || other.confidenceScore == confidenceScore));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,draftSubject,draftBody,confidenceScore);

@override
String toString() {
  return 'AiDraftResponseModel(draftSubject: $draftSubject, draftBody: $draftBody, confidenceScore: $confidenceScore)';
}


}

/// @nodoc
abstract mixin class $AiDraftResponseModelCopyWith<$Res>  {
  factory $AiDraftResponseModelCopyWith(AiDraftResponseModel value, $Res Function(AiDraftResponseModel) _then) = _$AiDraftResponseModelCopyWithImpl;
@useResult
$Res call({
 String draftSubject, String draftBody, double confidenceScore
});




}
/// @nodoc
class _$AiDraftResponseModelCopyWithImpl<$Res>
    implements $AiDraftResponseModelCopyWith<$Res> {
  _$AiDraftResponseModelCopyWithImpl(this._self, this._then);

  final AiDraftResponseModel _self;
  final $Res Function(AiDraftResponseModel) _then;

/// Create a copy of AiDraftResponseModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? draftSubject = null,Object? draftBody = null,Object? confidenceScore = null,}) {
  return _then(_self.copyWith(
draftSubject: null == draftSubject ? _self.draftSubject : draftSubject // ignore: cast_nullable_to_non_nullable
as String,draftBody: null == draftBody ? _self.draftBody : draftBody // ignore: cast_nullable_to_non_nullable
as String,confidenceScore: null == confidenceScore ? _self.confidenceScore : confidenceScore // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [AiDraftResponseModel].
extension AiDraftResponseModelPatterns on AiDraftResponseModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AiDraftResponseModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AiDraftResponseModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AiDraftResponseModel value)  $default,){
final _that = this;
switch (_that) {
case _AiDraftResponseModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AiDraftResponseModel value)?  $default,){
final _that = this;
switch (_that) {
case _AiDraftResponseModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String draftSubject,  String draftBody,  double confidenceScore)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AiDraftResponseModel() when $default != null:
return $default(_that.draftSubject,_that.draftBody,_that.confidenceScore);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String draftSubject,  String draftBody,  double confidenceScore)  $default,) {final _that = this;
switch (_that) {
case _AiDraftResponseModel():
return $default(_that.draftSubject,_that.draftBody,_that.confidenceScore);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String draftSubject,  String draftBody,  double confidenceScore)?  $default,) {final _that = this;
switch (_that) {
case _AiDraftResponseModel() when $default != null:
return $default(_that.draftSubject,_that.draftBody,_that.confidenceScore);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AiDraftResponseModel implements AiDraftResponseModel {
  const _AiDraftResponseModel({required this.draftSubject, required this.draftBody, required this.confidenceScore});
  factory _AiDraftResponseModel.fromJson(Map<String, dynamic> json) => _$AiDraftResponseModelFromJson(json);

@override final  String draftSubject;
@override final  String draftBody;
@override final  double confidenceScore;

/// Create a copy of AiDraftResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AiDraftResponseModelCopyWith<_AiDraftResponseModel> get copyWith => __$AiDraftResponseModelCopyWithImpl<_AiDraftResponseModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AiDraftResponseModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AiDraftResponseModel&&(identical(other.draftSubject, draftSubject) || other.draftSubject == draftSubject)&&(identical(other.draftBody, draftBody) || other.draftBody == draftBody)&&(identical(other.confidenceScore, confidenceScore) || other.confidenceScore == confidenceScore));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,draftSubject,draftBody,confidenceScore);

@override
String toString() {
  return 'AiDraftResponseModel(draftSubject: $draftSubject, draftBody: $draftBody, confidenceScore: $confidenceScore)';
}


}

/// @nodoc
abstract mixin class _$AiDraftResponseModelCopyWith<$Res> implements $AiDraftResponseModelCopyWith<$Res> {
  factory _$AiDraftResponseModelCopyWith(_AiDraftResponseModel value, $Res Function(_AiDraftResponseModel) _then) = __$AiDraftResponseModelCopyWithImpl;
@override @useResult
$Res call({
 String draftSubject, String draftBody, double confidenceScore
});




}
/// @nodoc
class __$AiDraftResponseModelCopyWithImpl<$Res>
    implements _$AiDraftResponseModelCopyWith<$Res> {
  __$AiDraftResponseModelCopyWithImpl(this._self, this._then);

  final _AiDraftResponseModel _self;
  final $Res Function(_AiDraftResponseModel) _then;

/// Create a copy of AiDraftResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? draftSubject = null,Object? draftBody = null,Object? confidenceScore = null,}) {
  return _then(_AiDraftResponseModel(
draftSubject: null == draftSubject ? _self.draftSubject : draftSubject // ignore: cast_nullable_to_non_nullable
as String,draftBody: null == draftBody ? _self.draftBody : draftBody // ignore: cast_nullable_to_non_nullable
as String,confidenceScore: null == confidenceScore ? _self.confidenceScore : confidenceScore // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$AiSummarizeResponseModel {

 String get overview; List<String> get keyTakeaways; List<String> get suggestedActions;
/// Create a copy of AiSummarizeResponseModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AiSummarizeResponseModelCopyWith<AiSummarizeResponseModel> get copyWith => _$AiSummarizeResponseModelCopyWithImpl<AiSummarizeResponseModel>(this as AiSummarizeResponseModel, _$identity);

  /// Serializes this AiSummarizeResponseModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AiSummarizeResponseModel&&(identical(other.overview, overview) || other.overview == overview)&&const DeepCollectionEquality().equals(other.keyTakeaways, keyTakeaways)&&const DeepCollectionEquality().equals(other.suggestedActions, suggestedActions));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,overview,const DeepCollectionEquality().hash(keyTakeaways),const DeepCollectionEquality().hash(suggestedActions));

@override
String toString() {
  return 'AiSummarizeResponseModel(overview: $overview, keyTakeaways: $keyTakeaways, suggestedActions: $suggestedActions)';
}


}

/// @nodoc
abstract mixin class $AiSummarizeResponseModelCopyWith<$Res>  {
  factory $AiSummarizeResponseModelCopyWith(AiSummarizeResponseModel value, $Res Function(AiSummarizeResponseModel) _then) = _$AiSummarizeResponseModelCopyWithImpl;
@useResult
$Res call({
 String overview, List<String> keyTakeaways, List<String> suggestedActions
});




}
/// @nodoc
class _$AiSummarizeResponseModelCopyWithImpl<$Res>
    implements $AiSummarizeResponseModelCopyWith<$Res> {
  _$AiSummarizeResponseModelCopyWithImpl(this._self, this._then);

  final AiSummarizeResponseModel _self;
  final $Res Function(AiSummarizeResponseModel) _then;

/// Create a copy of AiSummarizeResponseModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? overview = null,Object? keyTakeaways = null,Object? suggestedActions = null,}) {
  return _then(_self.copyWith(
overview: null == overview ? _self.overview : overview // ignore: cast_nullable_to_non_nullable
as String,keyTakeaways: null == keyTakeaways ? _self.keyTakeaways : keyTakeaways // ignore: cast_nullable_to_non_nullable
as List<String>,suggestedActions: null == suggestedActions ? _self.suggestedActions : suggestedActions // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [AiSummarizeResponseModel].
extension AiSummarizeResponseModelPatterns on AiSummarizeResponseModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AiSummarizeResponseModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AiSummarizeResponseModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AiSummarizeResponseModel value)  $default,){
final _that = this;
switch (_that) {
case _AiSummarizeResponseModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AiSummarizeResponseModel value)?  $default,){
final _that = this;
switch (_that) {
case _AiSummarizeResponseModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String overview,  List<String> keyTakeaways,  List<String> suggestedActions)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AiSummarizeResponseModel() when $default != null:
return $default(_that.overview,_that.keyTakeaways,_that.suggestedActions);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String overview,  List<String> keyTakeaways,  List<String> suggestedActions)  $default,) {final _that = this;
switch (_that) {
case _AiSummarizeResponseModel():
return $default(_that.overview,_that.keyTakeaways,_that.suggestedActions);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String overview,  List<String> keyTakeaways,  List<String> suggestedActions)?  $default,) {final _that = this;
switch (_that) {
case _AiSummarizeResponseModel() when $default != null:
return $default(_that.overview,_that.keyTakeaways,_that.suggestedActions);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AiSummarizeResponseModel implements AiSummarizeResponseModel {
  const _AiSummarizeResponseModel({required this.overview, required this.keyTakeaways, required this.suggestedActions});
  factory _AiSummarizeResponseModel.fromJson(Map<String, dynamic> json) => _$AiSummarizeResponseModelFromJson(json);

@override final  String overview;
@override final  List<String> keyTakeaways;
@override final  List<String> suggestedActions;

/// Create a copy of AiSummarizeResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AiSummarizeResponseModelCopyWith<_AiSummarizeResponseModel> get copyWith => __$AiSummarizeResponseModelCopyWithImpl<_AiSummarizeResponseModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AiSummarizeResponseModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AiSummarizeResponseModel&&(identical(other.overview, overview) || other.overview == overview)&&const DeepCollectionEquality().equals(other.keyTakeaways, keyTakeaways)&&const DeepCollectionEquality().equals(other.suggestedActions, suggestedActions));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,overview,const DeepCollectionEquality().hash(keyTakeaways),const DeepCollectionEquality().hash(suggestedActions));

@override
String toString() {
  return 'AiSummarizeResponseModel(overview: $overview, keyTakeaways: $keyTakeaways, suggestedActions: $suggestedActions)';
}


}

/// @nodoc
abstract mixin class _$AiSummarizeResponseModelCopyWith<$Res> implements $AiSummarizeResponseModelCopyWith<$Res> {
  factory _$AiSummarizeResponseModelCopyWith(_AiSummarizeResponseModel value, $Res Function(_AiSummarizeResponseModel) _then) = __$AiSummarizeResponseModelCopyWithImpl;
@override @useResult
$Res call({
 String overview, List<String> keyTakeaways, List<String> suggestedActions
});




}
/// @nodoc
class __$AiSummarizeResponseModelCopyWithImpl<$Res>
    implements _$AiSummarizeResponseModelCopyWith<$Res> {
  __$AiSummarizeResponseModelCopyWithImpl(this._self, this._then);

  final _AiSummarizeResponseModel _self;
  final $Res Function(_AiSummarizeResponseModel) _then;

/// Create a copy of AiSummarizeResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? overview = null,Object? keyTakeaways = null,Object? suggestedActions = null,}) {
  return _then(_AiSummarizeResponseModel(
overview: null == overview ? _self.overview : overview // ignore: cast_nullable_to_non_nullable
as String,keyTakeaways: null == keyTakeaways ? _self.keyTakeaways : keyTakeaways // ignore: cast_nullable_to_non_nullable
as List<String>,suggestedActions: null == suggestedActions ? _self.suggestedActions : suggestedActions // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}

// dart format on
