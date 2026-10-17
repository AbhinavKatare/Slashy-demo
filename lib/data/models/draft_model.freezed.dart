// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'draft_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$DraftModel {

 String get id; String? get threadId; List<ParticipantModel> get recipients; String get subject; String get bodyText; String get updatedAt;
/// Create a copy of DraftModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DraftModelCopyWith<DraftModel> get copyWith => _$DraftModelCopyWithImpl<DraftModel>(this as DraftModel, _$identity);

  /// Serializes this DraftModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DraftModel&&(identical(other.id, id) || other.id == id)&&(identical(other.threadId, threadId) || other.threadId == threadId)&&const DeepCollectionEquality().equals(other.recipients, recipients)&&(identical(other.subject, subject) || other.subject == subject)&&(identical(other.bodyText, bodyText) || other.bodyText == bodyText)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,threadId,const DeepCollectionEquality().hash(recipients),subject,bodyText,updatedAt);

@override
String toString() {
  return 'DraftModel(id: $id, threadId: $threadId, recipients: $recipients, subject: $subject, bodyText: $bodyText, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $DraftModelCopyWith<$Res>  {
  factory $DraftModelCopyWith(DraftModel value, $Res Function(DraftModel) _then) = _$DraftModelCopyWithImpl;
@useResult
$Res call({
 String id, String? threadId, List<ParticipantModel> recipients, String subject, String bodyText, String updatedAt
});




}
/// @nodoc
class _$DraftModelCopyWithImpl<$Res>
    implements $DraftModelCopyWith<$Res> {
  _$DraftModelCopyWithImpl(this._self, this._then);

  final DraftModel _self;
  final $Res Function(DraftModel) _then;

/// Create a copy of DraftModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? threadId = freezed,Object? recipients = null,Object? subject = null,Object? bodyText = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,threadId: freezed == threadId ? _self.threadId : threadId // ignore: cast_nullable_to_non_nullable
as String?,recipients: null == recipients ? _self.recipients : recipients // ignore: cast_nullable_to_non_nullable
as List<ParticipantModel>,subject: null == subject ? _self.subject : subject // ignore: cast_nullable_to_non_nullable
as String,bodyText: null == bodyText ? _self.bodyText : bodyText // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [DraftModel].
extension DraftModelPatterns on DraftModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DraftModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DraftModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DraftModel value)  $default,){
final _that = this;
switch (_that) {
case _DraftModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DraftModel value)?  $default,){
final _that = this;
switch (_that) {
case _DraftModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String? threadId,  List<ParticipantModel> recipients,  String subject,  String bodyText,  String updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DraftModel() when $default != null:
return $default(_that.id,_that.threadId,_that.recipients,_that.subject,_that.bodyText,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String? threadId,  List<ParticipantModel> recipients,  String subject,  String bodyText,  String updatedAt)  $default,) {final _that = this;
switch (_that) {
case _DraftModel():
return $default(_that.id,_that.threadId,_that.recipients,_that.subject,_that.bodyText,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String? threadId,  List<ParticipantModel> recipients,  String subject,  String bodyText,  String updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _DraftModel() when $default != null:
return $default(_that.id,_that.threadId,_that.recipients,_that.subject,_that.bodyText,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DraftModel implements DraftModel {
  const _DraftModel({required this.id, this.threadId, this.recipients = const [], required this.subject, required this.bodyText, required this.updatedAt});
  factory _DraftModel.fromJson(Map<String, dynamic> json) => _$DraftModelFromJson(json);

@override final  String id;
@override final  String? threadId;
@override@JsonKey() final  List<ParticipantModel> recipients;
@override final  String subject;
@override final  String bodyText;
@override final  String updatedAt;

/// Create a copy of DraftModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DraftModelCopyWith<_DraftModel> get copyWith => __$DraftModelCopyWithImpl<_DraftModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DraftModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DraftModel&&(identical(other.id, id) || other.id == id)&&(identical(other.threadId, threadId) || other.threadId == threadId)&&const DeepCollectionEquality().equals(other.recipients, recipients)&&(identical(other.subject, subject) || other.subject == subject)&&(identical(other.bodyText, bodyText) || other.bodyText == bodyText)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,threadId,const DeepCollectionEquality().hash(recipients),subject,bodyText,updatedAt);

@override
String toString() {
  return 'DraftModel(id: $id, threadId: $threadId, recipients: $recipients, subject: $subject, bodyText: $bodyText, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$DraftModelCopyWith<$Res> implements $DraftModelCopyWith<$Res> {
  factory _$DraftModelCopyWith(_DraftModel value, $Res Function(_DraftModel) _then) = __$DraftModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String? threadId, List<ParticipantModel> recipients, String subject, String bodyText, String updatedAt
});




}
/// @nodoc
class __$DraftModelCopyWithImpl<$Res>
    implements _$DraftModelCopyWith<$Res> {
  __$DraftModelCopyWithImpl(this._self, this._then);

  final _DraftModel _self;
  final $Res Function(_DraftModel) _then;

/// Create a copy of DraftModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? threadId = freezed,Object? recipients = null,Object? subject = null,Object? bodyText = null,Object? updatedAt = null,}) {
  return _then(_DraftModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,threadId: freezed == threadId ? _self.threadId : threadId // ignore: cast_nullable_to_non_nullable
as String?,recipients: null == recipients ? _self.recipients : recipients // ignore: cast_nullable_to_non_nullable
as List<ParticipantModel>,subject: null == subject ? _self.subject : subject // ignore: cast_nullable_to_non_nullable
as String,bodyText: null == bodyText ? _self.bodyText : bodyText // ignore: cast_nullable_to_non_nullable
as String,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
